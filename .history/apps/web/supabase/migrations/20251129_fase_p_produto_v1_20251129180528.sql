-- ============================================================================
-- FASE PRODUTO V1 — Telemetria + Estrutura de Produto
-- ============================================================================
-- Data: 29/11/2025
-- 
-- Este migration adiciona:
-- 1. Tabela product_events para telemetria
-- 2. Campo onboarding_progress em accounts
-- 3. Funções auxiliares para produto
-- ============================================================================

-- ============================================================================
-- PARTE 1: TELEMETRIA DE USO (FASE P6)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_events_user_id ON public.product_events(user_id);
CREATE INDEX IF NOT EXISTS idx_product_events_evento ON public.product_events(evento);
CREATE INDEX IF NOT EXISTS idx_product_events_created_at ON public.product_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_events_company_id ON public.product_events(company_id) WHERE company_id IS NOT NULL;

-- RLS
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_events_read ON public.product_events;
CREATE POLICY product_events_read ON public.product_events
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS product_events_insert ON public.product_events;
CREATE POLICY product_events_insert ON public.product_events
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PARTE 2: ONBOARDING PROGRESS
-- ============================================================================

-- Adicionar campo de progresso de onboarding em accounts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'onboarding_progress'
  ) THEN
    ALTER TABLE public.accounts 
    ADD COLUMN onboarding_progress JSONB DEFAULT '{
      "first_lead_created": false,
      "first_list_created": false,
      "first_export_done": false,
      "first_whatsapp_clicked": false
    }'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: FUNÇÃO PARA CRIAR LEAD VIA CHAT AI
-- ============================================================================

CREATE OR REPLACE FUNCTION public.criar_lead_via_chat(
  p_user_id UUID,
  p_nome TEXT,
  p_cidade TEXT,
  p_categoria TEXT,
  p_telefone TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_instagram TEXT DEFAULT NULL
)
RETURNS TABLE(
  company_id UUID,
  list_id UUID,
  list_name TEXT,
  message TEXT
) AS $$
DECLARE
  v_company_id UUID;
  v_list_id UUID;
  v_list_name TEXT;
  v_account_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_date_str TEXT := TO_CHAR(v_now, 'DD/MM/YYYY');
BEGIN
  -- Buscar account_id do usuário
  SELECT id INTO v_account_id 
  FROM public.accounts 
  WHERE primary_owner_user_id = p_user_id 
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não possui account associado';
  END IF;

  -- Nome da lista default
  v_list_name := 'Leads via Chat AI — ' || v_date_str;

  -- Buscar ou criar lista default
  SELECT id INTO v_list_id 
  FROM public.lists 
  WHERE nome = v_list_name 
    AND account_id = v_account_id 
  LIMIT 1;

  IF v_list_id IS NULL THEN
    INSERT INTO public.lists (account_id, nome, descricao, is_public, created_by)
    VALUES (
      v_account_id,
      v_list_name,
      'Lista criada automaticamente via Chat AI',
      false,
      p_user_id
    )
    RETURNING id INTO v_list_id;
  END IF;

  -- Criar empresa
  INSERT INTO public.companies (
    account_id,
    name,
    municipio,
    category,
    phone,
    website,
    lead_status,
    responsavel_id,
    ultima_interacao,
    created_at,
    updated_at
  )
  VALUES (
    v_account_id,
    p_nome,
    p_cidade,
    p_categoria,
    p_telefone,
    p_website,
    'novo',
    p_user_id,
    v_now,
    v_now,
    v_now
  )
  RETURNING id INTO v_company_id;

  -- Adicionar empresa à lista
  INSERT INTO public.list_companies (list_id, company_id, added_by, added_at)
  VALUES (v_list_id, v_company_id, p_user_id, v_now);

  -- Registrar evento de telemetria
  INSERT INTO public.product_events (user_id, evento, company_id, list_id, metadata)
  VALUES (
    p_user_id,
    'lead_criado_via_chat',
    v_company_id,
    v_list_id,
    jsonb_build_object(
      'nome', p_nome,
      'cidade', p_cidade,
      'categoria', p_categoria,
      'tem_telefone', p_telefone IS NOT NULL,
      'tem_website', p_website IS NOT NULL
    )
  );

  -- Atualizar progresso de onboarding
  UPDATE public.accounts
  SET onboarding_progress = jsonb_set(
    COALESCE(onboarding_progress, '{}'::jsonb),
    '{first_lead_created}',
    'true'::jsonb
  )
  WHERE id = v_account_id;

  -- Retornar resultado
  RETURN QUERY SELECT 
    v_company_id,
    v_list_id,
    v_list_name,
    'Lead criado com sucesso!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.criar_lead_via_chat(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- PARTE 4: VIEWS AUXILIARES
-- ============================================================================

-- View para dashboard de telemetria
CREATE OR REPLACE VIEW public.product_metrics_daily AS
SELECT 
  user_id,
  DATE(created_at) AS dia,
  evento,
  COUNT(*) AS total
FROM public.product_events
GROUP BY user_id, DATE(created_at), evento
ORDER BY dia DESC, total DESC;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.product_events IS 'Eventos de telemetria do produto (FASE P6)';
COMMENT ON FUNCTION public.criar_lead_via_chat IS 'Cria lead via Chat AI com lista automática e scoring (FASE P1)';
COMMENT ON COLUMN public.accounts.onboarding_progress IS 'Progresso do onboarding do usuário (FASE P2)';

