-- ============================================
-- FASE C2 - MASTER CRM VIEW
-- Data: 29/11/2025
-- Objetivo: Central unificada de todas as empresas
-- ============================================

-- Esta é a VIEW MESTRE que unifica TUDO:
-- ✅ Empresas de todas as origens
-- ✅ Interações registradas
-- ✅ Propostas enviadas
-- ✅ Listas onde estão
-- ✅ Métricas agregadas
-- ✅ Campos derivados para filtros

BEGIN;

-- ============================================
-- PARTE 1: ADICIONAR CAMPOS NA TABELA companies
-- ============================================

-- Adicionar campos de gestão comercial se não existirem
DO $$ 
BEGIN
  -- Lead status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'lead_status'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN lead_status TEXT DEFAULT 'novo' 
    CHECK (lead_status IN ('novo', 'contatado', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido', 'descartado'));
  END IF;

  -- Pipeline stage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'pipeline_stage'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN pipeline_stage TEXT DEFAULT 'descoberta';
  END IF;

  -- Responsável
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'responsavel_id'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN responsavel_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;

  -- Última interação (timestamp cache)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'ultima_interacao'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN ultima_interacao TIMESTAMPTZ NULL;
  END IF;

  -- Município (para filtros)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'municipio'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN municipio TEXT NULL;
  END IF;

  -- UF (para filtros)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'uf'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN uf TEXT NULL;
  END IF;

  -- Categoria principal (extrair do categories JSONB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN category TEXT NULL;
  END IF;

  -- Total de reviews (renomear de reviews_count se existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'reviews_count'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'total_reviews'
  ) THEN
    ALTER TABLE public.companies 
    RENAME COLUMN reviews_count TO total_reviews;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'total_reviews'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;

END $$;

-- Comentários
COMMENT ON COLUMN public.companies.lead_status IS 
'Status do lead no funil de vendas: novo, contatado, qualificado, proposta, negociacao, ganho, perdido, descartado';

COMMENT ON COLUMN public.companies.pipeline_stage IS 
'Etapa customizável do pipeline comercial da empresa';

COMMENT ON COLUMN public.companies.responsavel_id IS 
'Vendedor/comercial responsável por essa empresa';

COMMENT ON COLUMN public.companies.ultima_interacao IS 
'Timestamp da última interação registrada (cache para performance)';

-- ============================================
-- PARTE 2: CRIAR A VIEW MASTER
-- ============================================

DROP VIEW IF EXISTS public.companies_master_view CASCADE;

CREATE OR REPLACE VIEW public.companies_master_view AS
SELECT 
  -- Identificação
  c.id AS company_id,
  c.name,
  c.category,
  c.municipio AS city,
  c.uf AS state,
  
  -- Contato
  c.website,
  c.phone,
  c.address,
  c.google_maps_link,
  
  -- Métricas
  c.rating,
  c.total_reviews,
  
  -- Gestão comercial
  c.lead_status,
  c.pipeline_stage,
  c.responsavel_id,
  c.ultima_interacao,
  
  -- Campos derivados
  CASE WHEN c.website IS NOT NULL AND c.website <> '' THEN TRUE ELSE FALSE END AS has_site,
  
  -- Próxima ação (interação mais próxima no futuro)
  (
    SELECT MIN(ci.next_action_at)
    FROM public.company_interactions ci
    WHERE ci.company_id = c.id 
    AND ci.next_action_at > NOW()
  ) AS proxima_acao,
  
  -- Follow-up vencido
  (
    SELECT COUNT(*)
    FROM public.company_interactions ci
    WHERE ci.company_id = c.id 
    AND ci.next_action_at < NOW()
    AND ci.next_action_at IS NOT NULL
  ) > 0 AS followup_vencido,
  
  -- Total de interações
  (
    SELECT COUNT(*)
    FROM public.company_interactions ci
    WHERE ci.company_id = c.id
  ) AS total_interacoes,
  
  -- Total de propostas (se existir tabela proposals)
  COALESCE((
    SELECT COUNT(*)
    FROM public.proposals p
    WHERE p.company_id = c.id
  ), 0) AS total_propostas,
  
  -- Listas onde a empresa está
  (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'list_id', l.id,
          'list_name', l.nome,
          'is_public', l.is_public
        ) ORDER BY l.nome
      ),
      '[]'::json
    )
    FROM public.list_companies lc
    INNER JOIN public.lists l ON l.id = lc.list_id
    WHERE lc.company_id = c.id
  ) AS listas,
  
  -- Total de listas
  (
    SELECT COUNT(DISTINCT lc.list_id)
    FROM public.list_companies lc
    WHERE lc.company_id = c.id
  ) AS total_listas,
  
  -- Query de busca que criou a empresa
  (
    SELECT s.query
    FROM public.searches s
    WHERE s.id = c.search_id
    LIMIT 1
  ) AS created_from_search,
  
  -- Hot lead (interações recentes + rating alto)
  CASE 
    WHEN (
      SELECT COUNT(*)
      FROM public.company_interactions ci
      WHERE ci.company_id = c.id 
      AND ci.created_at > NOW() - INTERVAL '7 days'
    ) >= 3 
    OR (c.rating >= 4.5 AND c.total_reviews >= 50)
    THEN TRUE
    ELSE FALSE
  END AS is_hot_lead,
  
  -- Dias sem interação
  CASE 
    WHEN c.ultima_interacao IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (NOW() - c.ultima_interacao))::INTEGER / 86400
    ELSE NULL
  END AS dias_sem_interacao,
  
  -- Origem (user que criou)
  (
    SELECT s.user_id
    FROM public.searches s
    WHERE s.id = c.search_id
    LIMIT 1
  ) AS created_by_user_id,
  
  -- Timestamps
  c.created_at,
  c.updated_at,
  
  -- IDs auxiliares
  c.search_id,
  c.place_id

FROM public.companies c;

-- Comentários da view
COMMENT ON VIEW public.companies_master_view IS 
'VIEW MESTRE unificando todas as empresas do sistema.
Combina: companies, searches, interactions, proposals, lists.
Usada pela tela /crm como fonte única de verdade.';

-- ============================================
-- PARTE 3: ÍNDICES OTIMIZADOS
-- ============================================

-- Índices nos novos campos de companies
CREATE INDEX IF NOT EXISTS idx_companies_lead_status 
  ON public.companies(lead_status) 
  WHERE lead_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_responsavel_id 
  ON public.companies(responsavel_id) 
  WHERE responsavel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_ultima_interacao 
  ON public.companies(ultima_interacao DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_companies_category 
  ON public.companies(category) 
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_municipio 
  ON public.companies(municipio) 
  WHERE municipio IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_uf 
  ON public.companies(uf) 
  WHERE uf IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_rating 
  ON public.companies(rating DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_companies_total_reviews 
  ON public.companies(total_reviews DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_companies_has_website 
  ON public.companies((website IS NOT NULL AND website <> ''));

-- Índice composto para filtros combinados mais comuns
CREATE INDEX IF NOT EXISTS idx_companies_crm_filters 
  ON public.companies(lead_status, responsavel_id, category, municipio)
  WHERE lead_status IS NOT NULL;

-- Habilitar extensão pg_trgm para busca por similaridade
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice para busca por nome (usando pg_trgm)
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm 
  ON public.companies USING gin(name gin_trgm_ops);

-- ============================================
-- PARTE 4: TRIGGER PARA ATUALIZAR ultima_interacao
-- ============================================

-- Função para atualizar o campo ultima_interacao
CREATE OR REPLACE FUNCTION update_company_ultima_interacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Ao inserir ou atualizar interação, atualiza o timestamp na company
  UPDATE public.companies
  SET ultima_interacao = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_update_company_ultima_interacao ON public.company_interactions;

CREATE TRIGGER trg_update_company_ultima_interacao
  AFTER INSERT OR UPDATE ON public.company_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_company_ultima_interacao();

COMMENT ON FUNCTION update_company_ultima_interacao() IS 
'Atualiza o campo ultima_interacao na tabela companies sempre que uma interação é criada ou atualizada';

-- ============================================
-- PARTE 5: RLS PARA A VIEW (HERDA DAS TABELAS BASE)
-- ============================================

-- A view herda automaticamente as políticas RLS das tabelas base
-- Mas vamos garantir que funcione corretamente

-- Política adicional: usuário pode ver empresas onde é responsável
DROP POLICY IF EXISTS companies_responsavel_read ON public.companies;

CREATE POLICY companies_responsavel_read ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    responsavel_id = auth.uid()
  );

-- ============================================
-- PARTE 6: FUNÇÃO AUXILIAR PARA CONTAGEM
-- ============================================

-- Função para contar empresas com filtros
CREATE OR REPLACE FUNCTION count_companies_with_filters(
  p_lead_status TEXT DEFAULT NULL,
  p_responsavel_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_municipio TEXT DEFAULT NULL,
  p_uf TEXT DEFAULT NULL,
  p_has_website BOOLEAN DEFAULT NULL,
  p_rating_min DECIMAL DEFAULT NULL,
  p_sem_interacao_dias INTEGER DEFAULT NULL,
  p_search_text TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.companies_master_view
  WHERE 
    (p_lead_status IS NULL OR lead_status = p_lead_status)
    AND (p_responsavel_id IS NULL OR responsavel_id = p_responsavel_id)
    AND (p_category IS NULL OR category = p_category)
    AND (p_municipio IS NULL OR city = p_municipio)
    AND (p_uf IS NULL OR state = p_uf)
    AND (p_has_website IS NULL OR has_site = p_has_website)
    AND (p_rating_min IS NULL OR rating >= p_rating_min)
    AND (p_sem_interacao_dias IS NULL OR dias_sem_interacao >= p_sem_interacao_dias)
    AND (p_search_text IS NULL OR name ILIKE '%' || p_search_text || '%');
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION count_companies_with_filters IS 
'Conta empresas aplicando filtros combinados. Usado para paginação e estatísticas.';

-- ============================================
-- PARTE 7: GRANTS
-- ============================================

GRANT SELECT ON public.companies_master_view TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION count_companies_with_filters TO authenticated, service_role;

COMMIT;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar se a view foi criada
  SELECT COUNT(*) INTO v_count
  FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name = 'companies_master_view';
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'ERRO: View companies_master_view não foi criada!';
  ELSE
    RAISE NOTICE '✅ View companies_master_view criada com sucesso';
  END IF;
  
  -- Verificar índices
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename = 'companies'
  AND indexname LIKE 'idx_companies_%';
  
  RAISE NOTICE '✅ % índices criados na tabela companies', v_count;
  
  -- Testar a view
  SELECT COUNT(*) INTO v_count
  FROM public.companies_master_view;
  
  RAISE NOTICE '✅ View acessível: % empresas encontradas', v_count;
  
END $$;
