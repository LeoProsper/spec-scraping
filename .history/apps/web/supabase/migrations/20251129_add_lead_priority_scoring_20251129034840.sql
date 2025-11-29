-- ============================================================================
-- FASE 4: Sistema de Prioridade Automática de Leads (Scoring)
-- ============================================================================
-- Data: 29/11/2025
-- 
-- Este migration adiciona:
-- 1. Colunas para armazenar score e nível de prioridade
-- 2. Função para calcular prioridade baseada em 6 critérios
-- 3. Trigger para recalcular automaticamente
-- ============================================================================

-- Adicionar colunas de prioridade
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'baixa';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_companies_priority_score ON public.companies(priority_score DESC);

-- ============================================================================
-- FUNÇÃO: calculate_lead_priority
-- ============================================================================
-- Calcula score de 0 a 100 baseado em:
--   ✅ Sem site = +20 pontos
--   ✅ Avaliação < 3.5 = +20 pontos
--   ✅ Reviews < 15 = +15 pontos
--   ✅ Interação recente (últimos 7 dias) = +15 pontos
--   ✅ Sem interação > 14 dias = +10 pontos
--   ✅ Categoria estratégica = +20 pontos
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_lead_priority(p_company_id UUID)
RETURNS TABLE(score INTEGER, level TEXT) AS $$
DECLARE
  v_score INTEGER := 0;
  v_level TEXT;
  v_website TEXT;
  v_rating NUMERIC;
  v_reviews INTEGER;
  v_last_interaction TIMESTAMP;
  v_category TEXT;
  v_lead_status TEXT;
  v_days_since_interaction INTEGER;
  
  -- Categorias estratégicas (ajuste conforme seu negócio)
  strategic_categories TEXT[] := ARRAY[
    'Restaurante',
    'Clínica médica',
    'Academia',
    'Hotel',
    'Loja de roupas',
    'Salão de beleza',
    'Dentista',
    'Advocacia'
  ];
BEGIN
  -- Buscar dados da empresa
  SELECT 
    website,
    rating,
    total_reviews,
    lead_status,
    category,
    (SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id)
  INTO 
    v_website,
    v_rating,
    v_reviews,
    v_lead_status,
    v_category,
    v_last_interaction
  FROM companies
  WHERE company_id = p_company_id;

  -- Ignorar leads ganhos ou perdidos
  IF v_lead_status IN ('ganho', 'perdido') THEN
    score := 0;
    level := 'baixa';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Calcular dias desde última interação
  IF v_last_interaction IS NOT NULL THEN
    v_days_since_interaction := EXTRACT(DAY FROM NOW() - v_last_interaction);
  END IF;

  -- CRITÉRIO 1: Sem site (+20 pontos)
  IF v_website IS NULL THEN
    v_score := v_score + 20;
  END IF;

  -- CRITÉRIO 2: Avaliação baixa < 3.5 (+20 pontos)
  IF v_rating IS NOT NULL AND v_rating < 3.5 THEN
    v_score := v_score + 20;
  END IF;

  -- CRITÉRIO 3: Poucas reviews < 15 (+15 pontos)
  IF v_reviews IS NOT NULL AND v_reviews < 15 THEN
    v_score := v_score + 15;
  END IF;

  -- CRITÉRIO 4: Interação recente últimos 7 dias (+15 pontos)
  IF v_days_since_interaction IS NOT NULL AND v_days_since_interaction <= 7 THEN
    v_score := v_score + 15;
  END IF;

  -- CRITÉRIO 5: Sem interação > 14 dias (+10 pontos)
  IF v_last_interaction IS NULL OR v_days_since_interaction > 14 THEN
    v_score := v_score + 10;
  END IF;

  -- CRITÉRIO 6: Categoria estratégica (+20 pontos)
  IF v_category = ANY(strategic_categories) THEN
    v_score := v_score + 20;
  END IF;

  -- Determinar nível de prioridade
  IF v_score >= 60 THEN
    v_level := 'alta';
  ELSIF v_score >= 30 THEN
    v_level := 'media';
  ELSE
    v_level := 'baixa';
  END IF;

  score := v_score;
  level := v_level;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Atualizar prioridade automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_company_priority()
RETURNS TRIGGER AS $$
DECLARE
  priority_result RECORD;
BEGIN
  -- Calcular nova prioridade
  SELECT * INTO priority_result 
  FROM calculate_lead_priority(NEW.company_id);

  -- Atualizar colunas
  NEW.priority_score := priority_result.score;
  NEW.priority_level := priority_result.level;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_company_priority ON public.companies;
CREATE TRIGGER trigger_update_company_priority
  BEFORE INSERT OR UPDATE OF website, rating, total_reviews, lead_status, category
  ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_priority();

-- ============================================================================
-- ATUALIZAR empresas existentes
-- ============================================================================

DO $$
DECLARE
  company_record RECORD;
  priority_result RECORD;
BEGIN
  FOR company_record IN 
    SELECT company_id FROM companies WHERE lead_status NOT IN ('ganho', 'perdido')
  LOOP
    SELECT * INTO priority_result 
    FROM calculate_lead_priority(company_record.company_id);

    UPDATE companies
    SET 
      priority_score = priority_result.score,
      priority_level = priority_result.level
    WHERE company_id = company_record.company_id;
  END LOOP;
END $$;

-- ============================================================================
-- GRANT permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.calculate_lead_priority(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_lead_priority(UUID) TO service_role;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN public.companies.priority_score IS 'Score de prioridade 0-100 calculado automaticamente';
COMMENT ON COLUMN public.companies.priority_level IS 'Nível: alta (60+), media (30-59), baixa (0-29)';
COMMENT ON FUNCTION public.calculate_lead_priority(UUID) IS 'Calcula prioridade do lead baseado em 6 critérios estratégicos';
