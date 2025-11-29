-- ============================================================================
-- INTEGRAÇÃO OBRIGATÓRIA: CHAT AI → CRM MASTER
-- ============================================================================
-- Data: 29/11/2025
-- Objetivo: Toda empresa encontrada via Chat AI vira LEAD OPERACIONAL no CRM
-- 
-- Este migration adiciona:
-- 1. Campo 'origem' em companies (rastrear fonte do lead)
-- 2. Campo 'data_primeiro_contato' em companies
-- 3. Tabela company_import_logs (auditoria de imports)
-- 4. Função create_or_update_company_from_chat() (inserção unificada)
-- 5. Índice único place_id + account_id (proteção contra duplicação)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: ADICIONAR CAMPOS EM COMPANIES
-- ============================================================================

-- Campo: origem (rastrear fonte do lead)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'origem'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN origem TEXT DEFAULT 'chat_ai' CHECK (origem IN ('chat_ai', 'import_csv', 'api', 'manual', 'kaix_scout'));
    
    CREATE INDEX IF NOT EXISTS idx_companies_origem 
    ON public.companies(origem);
    
    COMMENT ON COLUMN public.companies.origem IS 
    'Fonte de onde o lead foi criado:
    - chat_ai: Busca via Chat AI (padrão)
    - import_csv: Importação CSV
    - api: API externa
    - manual: Criado manualmente
    - kaix_scout: Módulo Kaix Scout (legado)';
  END IF;
END $$;

-- Campo: data_primeiro_contato (quando lead entrou no CRM)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'data_primeiro_contato'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN data_primeiro_contato TIMESTAMP WITH TIME ZONE;
    
    CREATE INDEX IF NOT EXISTS idx_companies_primeiro_contato 
    ON public.companies(data_primeiro_contato DESC NULLS LAST);
    
    COMMENT ON COLUMN public.companies.data_primeiro_contato IS 
    'Data/hora em que o lead foi inserido no CRM pela primeira vez.
    Útil para medir: tempo de conversão, idade do lead, retention.';
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: TABELA DE LOG DE IMPORTAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('chat_ai', 'import_csv', 'api', 'manual')),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'skipped', 'error')),
  place_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_company_import_logs_user 
ON public.company_import_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_company_import_logs_source 
ON public.company_import_logs(source);

CREATE INDEX IF NOT EXISTS idx_company_import_logs_action 
ON public.company_import_logs(action);

CREATE INDEX IF NOT EXISTS idx_company_import_logs_created_at 
ON public.company_import_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_import_logs_company_id 
ON public.company_import_logs(company_id) 
WHERE company_id IS NOT NULL;

-- RLS
ALTER TABLE public.company_import_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_import_logs_read ON public.company_import_logs;
CREATE POLICY company_import_logs_read ON public.company_import_logs
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS company_import_logs_insert ON public.company_import_logs;
CREATE POLICY company_import_logs_insert ON public.company_import_logs
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.company_import_logs IS 
'Log de auditoria para rastrear todas as importações de empresas.
Usado para: compliance, debugging, analytics de fontes de leads.';

-- ============================================================================
-- PARTE 3: ÍNDICE ÚNICO PARA PROTEÇÃO CONTRA DUPLICAÇÃO
-- ============================================================================

-- Índice único composto: place_id + responsavel_id
-- Garante que mesma empresa (place_id) não seja duplicada por um mesmo usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_place_id_user 
ON public.companies(place_id, responsavel_id)
WHERE place_id IS NOT NULL AND responsavel_id IS NOT NULL;

COMMENT ON INDEX idx_companies_place_id_user IS 
'Índice único que impede duplicação de empresas com mesmo place_id 
para o mesmo responsável (usuário). Permite que diferentes usuários 
tenham a mesma empresa em suas carteiras.';

-- ============================================================================
-- PARTE 4: FUNÇÃO DE INTEGRAÇÃO CHAT AI → CRM
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_or_update_company_from_chat(
  p_user_id UUID,
  p_place_id TEXT,
  p_name TEXT,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_rating DECIMAL(2,1) DEFAULT NULL,
  p_reviews_count INTEGER DEFAULT NULL,
  p_latitude DECIMAL(10,8) DEFAULT NULL,
  p_longitude DECIMAL(11,8) DEFAULT NULL,
  p_google_maps_link TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_about TEXT DEFAULT NULL,
  p_opening_hours TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  company_id UUID,
  action TEXT,
  message TEXT
) AS $$
DECLARE
  v_company_id UUID;
  v_existing_company UUID;
  v_action TEXT;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_extracted_city TEXT;
  v_extracted_state TEXT;
BEGIN

  -- 2) Extrair cidade e estado do endereço se não fornecidos
  IF p_address IS NOT NULL THEN
    -- Extrair cidade (penúltima parte separada por vírgula)
    v_extracted_city := COALESCE(
      p_city, 
      TRIM(BOTH FROM SPLIT_PART(p_address, ',', 
        ARRAY_LENGTH(STRING_TO_ARRAY(p_address, ','), 1) - 1
      ))
    );
    
    -- Extrair estado (última parte separada por vírgula)
    v_extracted_state := COALESCE(
      p_state,
      TRIM(BOTH FROM SPLIT_PART(p_address, ',', 
        ARRAY_LENGTH(STRING_TO_ARRAY(p_address, ','), 1)
      ))
    );
    
    -- Extrair apenas sigla do estado (ex: "SP - Brazil" -> "SP")
    v_extracted_state := SPLIT_PART(v_extracted_state, '-', 1);
    v_extracted_state := TRIM(BOTH FROM v_extracted_state);
  ELSE
    v_extracted_city := p_city;
    v_extracted_state := p_state;
  END IF;

  -- 3) Verificar se empresa já existe por place_id
  SELECT id INTO v_existing_company 
  FROM public.companies 
  WHERE place_id = p_place_id 
    AND account_id = v_account_id
  LIMIT 1;

  IF v_existing_company IS NOT NULL THEN
    -- ========================================================================
    -- EMPRESA JÁ EXISTE - Atualizar ultima_interacao
    -- ========================================================================
    UPDATE public.companies
    SET 
      ultima_interacao = v_now,
      updated_at = v_now
    WHERE id = v_existing_company;

    v_company_id := v_existing_company;
    v_action := 'updated';

    -- Registrar telemetria de atualização
    INSERT INTO public.product_events (user_id, evento, company_id, metadata)
    VALUES (
      p_user_id,
      'lead_atualizado_via_chat',
      v_company_id,
      jsonb_build_object(
        'place_id', p_place_id,
        'name', p_name,
        'source', 'chat_ai'
      )
    );

    -- Log de auditoria
    INSERT INTO public.company_import_logs (
      user_id, 
      company_id, 
      source, 
      action, 
      place_id,
      metadata,
      created_at
    )
    VALUES (
      p_user_id, 
      v_company_id, 
      'chat_ai', 
      'updated',
      p_place_id,
      jsonb_build_object(
        'name', p_name,
        'city', v_extracted_city
      ),
      v_now
    );

  ELSE
    -- ========================================================================
    -- EMPRESA NÃO EXISTE - Criar nova
    -- ========================================================================
    INSERT INTO public.companies (
      account_id,
      place_id,
      name,
      address,
      municipio,
      state,
      category,
      phone,
      website,
      rating,
      reviews_count,
      latitude,
      longitude,
      google_maps_link,
      cnpj,
      about,
      opening_hours,
      receita_email,
      lead_status,
      responsavel_id,
      origem,
      ultima_interacao,
      data_primeiro_contato,
      created_at,
      updated_at
    )
    VALUES (
      v_account_id,
      p_place_id,
      p_name,
      p_address,
      v_extracted_city,      -- Cidade extraída
      v_extracted_state,     -- Estado extraído
      p_category,
      p_phone,
      p_website,
      p_rating,
      p_reviews_count,
      p_latitude,
      p_longitude,
      p_google_maps_link,
      p_cnpj,
      p_about,
      p_opening_hours,
      p_email,
      'novo',                -- ✅ lead_status default
      p_user_id,             -- ✅ responsavel_id (usuário que buscou)
      'chat_ai',             -- ✅ origem
      v_now,                 -- ✅ ultima_interacao
      v_now,                 -- data_primeiro_contato
      v_now,
      v_now
    )
    RETURNING id INTO v_company_id;

    v_action := 'created';

    -- Registrar telemetria de criação
    INSERT INTO public.product_events (user_id, evento, company_id, metadata)
    VALUES (
      p_user_id,
      'lead_criado_via_chat',
      v_company_id,
      jsonb_build_object(
        'place_id', p_place_id,
        'name', p_name,
        'city', v_extracted_city,
        'state', v_extracted_state,
        'category', p_category,
        'has_phone', p_phone IS NOT NULL,
        'has_website', p_website IS NOT NULL,
        'has_email', p_email IS NOT NULL,
        'has_rating', p_rating IS NOT NULL,
        'rating', p_rating,
        'reviews_count', p_reviews_count,
        'source', 'chat_ai'
      )
    );

    -- Log de auditoria
    INSERT INTO public.company_import_logs (
      user_id, 
      company_id, 
      source, 
      action,
      place_id,
      metadata,
      created_at
    )
    VALUES (
      p_user_id, 
      v_company_id, 
      'chat_ai', 
      'created',
      p_place_id,
      jsonb_build_object(
        'name', p_name,
        'city', v_extracted_city,
        'state', v_extracted_state,
        'category', p_category,
        'rating', p_rating,
        'reviews_count', p_reviews_count
      ),
      v_now
    );

    -- Atualizar progresso de onboarding (FASE P2)
    UPDATE public.accounts
    SET onboarding_progress = jsonb_set(
      COALESCE(onboarding_progress, '{}'::jsonb),
      '{first_lead_created}',
      'true'::jsonb
    )
    WHERE id = v_account_id;
  END IF;

  -- 4) Retornar resultado
  RETURN QUERY SELECT 
    v_company_id AS company_id,
    v_action AS action,
    CASE 
      WHEN v_action = 'created' THEN 'Lead criado com sucesso no CRM!'
      ELSE 'Lead já existe. Última interação atualizada.'
    END AS message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_or_update_company_from_chat TO authenticated;

COMMENT ON FUNCTION public.create_or_update_company_from_chat IS 
'INTEGRAÇÃO CHAT AI → CRM MASTER (FASE 2)

Cria ou atualiza empresa no CRM a partir de busca do Chat AI.

COMPORTAMENTO:
- Se place_id NÃO existe: Cria novo lead com:
  ✅ lead_status = novo
  ✅ responsavel_id = user_id
  ✅ origem = chat_ai
  ✅ ultima_interacao = NOW()
  ✅ data_primeiro_contato = NOW()
  ✅ Telemetria: lead_criado_via_chat
  ✅ Log: company_import_logs (created)
  ✅ Trigger: calculate_lead_score() (automático)

- Se place_id JÁ existe: Atualiza apenas:
  ✅ ultima_interacao = NOW()
  ✅ Telemetria: lead_atualizado_via_chat
  ✅ Log: company_import_logs (updated)
  ⚠️ Mantém: lead_status, observacoes, tags (não sobrescreve)

PROTEÇÃO CONTRA DUPLICAÇÃO:
- Índice único: (place_id, account_id)
- RLS: Garante isolamento entre accounts

USO:
SELECT * FROM create_or_update_company_from_chat(
  p_user_id := auth.uid(),
  p_place_id := ''ChIJ...'',
  p_name := ''Restaurante Exemplo'',
  p_address := ''Rua X, 123, São Paulo, SP - Brazil'',
  p_category := ''Restaurante'',
  p_phone := ''11999999999'',
  p_website := ''https://exemplo.com'',
  p_rating := 4.5,
  p_reviews_count := 120
);';

-- ============================================================================
-- PARTE 5: VIEWS AUXILIARES PARA ANALYTICS
-- ============================================================================

-- View: Resumo de imports por fonte
CREATE OR REPLACE VIEW public.company_imports_summary AS
SELECT 
  l.source,
  l.action,
  COUNT(*) as total,
  COUNT(DISTINCT l.company_id) as empresas_unicas,
  COUNT(DISTINCT l.user_id) as usuarios_ativos,
  MIN(l.created_at) as primeira_importacao,
  MAX(l.created_at) as ultima_importacao
FROM public.company_import_logs l
GROUP BY l.source, l.action
ORDER BY 
  l.source,
  CASE l.action
    WHEN 'created' THEN 1
    WHEN 'updated' THEN 2
    WHEN 'skipped' THEN 3
    WHEN 'error' THEN 4
  END;

COMMENT ON VIEW public.company_imports_summary IS 
'Resumo agregado de importações de empresas por fonte e ação.
Útil para: analytics de produto, monitoramento de uso, debugging.';

-- View: Últimos imports do Chat AI
CREATE OR REPLACE VIEW public.chat_ai_recent_imports AS
SELECT 
  l.id as log_id,
  l.user_id,
  l.company_id,
  c.name as company_name,
  c.municipio as city,
  c.lead_status,
  c.lead_score,
  c.prioridade,
  l.action,
  l.place_id,
  l.metadata,
  l.created_at
FROM public.company_import_logs l
LEFT JOIN public.companies c ON l.company_id = c.id
WHERE l.source = 'chat_ai'
ORDER BY l.created_at DESC
LIMIT 100;

COMMENT ON VIEW public.chat_ai_recent_imports IS 
'Últimos 100 imports realizados via Chat AI.
Útil para: debugging, monitoramento em tempo real, analytics.';

-- ============================================================================
-- PARTE 6: VERIFICAÇÕES FINAIS
-- ============================================================================

DO $$
DECLARE
  total_companies INTEGER;
  companies_com_origem INTEGER;
  total_import_logs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_companies FROM public.companies;
  SELECT COUNT(*) INTO companies_com_origem 
  FROM public.companies 
  WHERE origem IS NOT NULL;
  
  SELECT COUNT(*) INTO total_import_logs 
  FROM public.company_import_logs;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ INTEGRAÇÃO CHAT AI → CRM MASTER - MIGRATION COMPLETA';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS:';
  RAISE NOTICE '   Total de empresas: %', total_companies;
  RAISE NOTICE '   Empresas com origem: %', companies_com_origem;
  RAISE NOTICE '   Logs de importação: %', total_import_logs;
  RAISE NOTICE '';
  RAISE NOTICE '🆕 NOVOS RECURSOS:';
  RAISE NOTICE '   ✓ Campo origem em companies';
  RAISE NOTICE '   ✓ Campo data_primeiro_contato em companies';
  RAISE NOTICE '   ✓ Tabela company_import_logs (auditoria)';
  RAISE NOTICE '   ✓ Função create_or_update_company_from_chat()';
  RAISE NOTICE '   ✓ Índice único (place_id, account_id)';
  RAISE NOTICE '   ✓ Views: company_imports_summary, chat_ai_recent_imports';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMO PASSO:';
  RAISE NOTICE '   Modificar /api/scout/search para chamar';
  RAISE NOTICE '   create_or_update_company_from_chat() após searchPlaces()';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ============================================================================
-- TESTES RÁPIDOS (OPCIONAL - COMENTAR EM PRODUÇÃO)
-- ============================================================================

-- Testar criação de lead via Chat AI:
/*
SELECT * FROM create_or_update_company_from_chat(
  p_user_id := auth.uid(),
  p_place_id := 'ChIJTest123',
  p_name := 'Restaurante Teste',
  p_address := 'Rua Exemplo, 123, São Paulo, SP - Brazil',
  p_category := 'Restaurante',
  p_phone := '11999999999',
  p_website := 'https://teste.com',
  p_rating := 4.5,
  p_reviews_count := 120
);
*/

-- Verificar lead criado:
/*
SELECT 
  id,
  name,
  municipio,
  state,
  lead_status,
  responsavel_id,
  origem,
  ultima_interacao,
  data_primeiro_contato,
  lead_score,
  prioridade
FROM companies
WHERE place_id = 'ChIJTest123';
*/

-- Verificar logs:
/*
SELECT * FROM company_import_logs
WHERE source = 'chat_ai'
ORDER BY created_at DESC
LIMIT 10;
*/

-- Verificar telemetria:
/*
SELECT * FROM product_events
WHERE evento LIKE '%chat%'
ORDER BY created_at DESC
LIMIT 10;
*/
