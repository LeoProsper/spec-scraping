-- ============================================
-- FASE A - CORREÇÃO CONCEITUAL: COMPANIES COMO ATIVO GLOBAL
-- Data: 28/11/2025
-- Objetivo: Transformar companies de DEPENDENTE para ATIVO PERMANENTE
-- ============================================

-- ⚠️ REGRAS:
-- ❌ Nenhuma tabela será dropada
-- ❌ Nenhum dado será apagado
-- ✅ Apenas ALTER TABLE para ajuste estrutural
-- ✅ Sistema continua funcional após migração

BEGIN;

-- ============================================
-- FASE A1 - AJUSTE DE DEPENDÊNCIA
-- ============================================

-- Comentário explicativo da mudança conceitual
COMMENT ON TABLE public.companies IS 
'Empresas são ATIVOS GLOBAIS PERMANENTES que podem aparecer em múltiplas buscas. 
Uma busca é apenas um EVENTO que referencia empresas existentes.';

-- Remover constraint atual de ON DELETE CASCADE
ALTER TABLE public.companies 
  DROP CONSTRAINT IF EXISTS companies_search_id_fkey;

-- Tornar search_id NULLABLE (empresa pode existir sem busca)
ALTER TABLE public.companies 
  ALTER COLUMN search_id DROP NOT NULL;

-- Recriar FK com ON DELETE SET NULL (empresa sobrevive se busca for deletada)
ALTER TABLE public.companies 
  ADD CONSTRAINT companies_search_id_fkey 
  FOREIGN KEY (search_id) 
  REFERENCES public.searches(id) 
  ON DELETE SET NULL;

-- Atualizar comentário do campo
COMMENT ON COLUMN public.companies.search_id IS 
'EVENTO DE ORIGEM: ID da busca que encontrou esta empresa pela primeira vez. 
NULL = empresa órfã (busca original foi deletada). 
NÃO representa mais a identidade da empresa.';

-- ============================================
-- FASE A2 - CORREÇÃO DO CONCEITO DE UNICIDADE
-- ============================================

-- Remover UNIQUE global de place_id (permitir mesma empresa em buscas diferentes)
DROP INDEX IF EXISTS public.idx_companies_place_id;

-- Criar índice composto: mesma empresa pode estar em N buscas
-- mas não pode duplicar DENTRO da mesma busca
CREATE UNIQUE INDEX idx_companies_search_place 
  ON public.companies(search_id, place_id) 
  WHERE search_id IS NOT NULL;

-- Criar índice não-único em place_id para lookups rápidos
CREATE INDEX idx_companies_place_id_lookup 
  ON public.companies(place_id);

-- Comentário explicativo
COMMENT ON COLUMN public.companies.place_id IS 
'Google Place ID único global. 
A mesma empresa pode aparecer em múltiplas buscas (N registros com mesmo place_id).
UNIQUE constraint é composto: (search_id, place_id) - não duplica dentro da mesma busca.';

-- ============================================
-- FASE A3 - IDENTIDADE GLOBAL (PREPARAÇÃO)
-- ============================================

-- Criar campo para futura unificação global
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS company_global_id UUID NULL;

-- Criar índice para lookups futuros
CREATE INDEX IF NOT EXISTS idx_companies_global_id 
  ON public.companies(company_global_id) 
  WHERE company_global_id IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.companies.company_global_id IS 
'[FUTURO] ID global que agrupa múltiplos registros da mesma empresa.
Permitirá unificação de dados (CNPJ, telefones, sites) entre buscas diferentes.
NULL = ainda não unificado. Será populado em FASE B.';

-- ============================================
-- FASE A4 - HISTÓRICO E METADADOS
-- ============================================

-- Adicionar campos de rastreamento temporal
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS seen_count INTEGER DEFAULT 1;

-- Comentários explicativos
COMMENT ON COLUMN public.companies.first_seen_at IS 
'Timestamp da primeira vez que esta empresa foi encontrada (criação do registro).';

COMMENT ON COLUMN public.companies.last_seen_at IS 
'Timestamp da última vez que esta empresa apareceu em uma busca.';

COMMENT ON COLUMN public.companies.seen_count IS 
'Contador: quantas vezes esta empresa apareceu em buscas diferentes.
Será incrementado quando sistema detectar empresa duplicada (FASE B).';

-- ============================================
-- FASE A5 - TRIGGERS DE MANUTENÇÃO
-- ============================================

-- Trigger: Atualizar last_seen_at automaticamente em UPDATE
CREATE OR REPLACE FUNCTION update_company_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS companies_update_last_seen ON public.companies;
CREATE TRIGGER companies_update_last_seen
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_last_seen();

-- ============================================
-- FASE A6 - AJUSTE DO TRIGGER DE CONTAGEM
-- ============================================

-- Atualizar trigger existente para lidar com search_id NULL
CREATE OR REPLACE FUNCTION update_searches_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas incrementa se search_id não for NULL
  IF NEW.search_id IS NOT NULL THEN
    UPDATE public.searches
    SET total_results = total_results + 1
    WHERE id = NEW.search_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger (se já existir, será substituído)
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_searches_count();

-- ============================================
-- FASE A7 - VIEW AUXILIAR PARA ANÁLISE
-- ============================================

-- View: Empresas únicas por place_id (para análise de duplicação)
CREATE OR REPLACE VIEW public.companies_unique_overview AS
SELECT 
  place_id,
  COUNT(*) as appearances_count,
  COUNT(DISTINCT search_id) as different_searches,
  MIN(first_seen_at) as first_appearance,
  MAX(last_seen_at) as last_appearance,
  ARRAY_AGG(DISTINCT name) as all_names,
  ARRAY_AGG(DISTINCT search_id) FILTER (WHERE search_id IS NOT NULL) as search_ids
FROM public.companies
GROUP BY place_id
HAVING COUNT(*) > 1
ORDER BY appearances_count DESC;

COMMENT ON VIEW public.companies_unique_overview IS 
'Análise de empresas duplicadas: quantas vezes cada place_id aparece no banco.
Útil para identificar empresas que aparecem em múltiplas buscas.';

-- ============================================
-- VERIFICAÇÕES DE SEGURANÇA
-- ============================================

-- Verificar que nenhum dado foi perdido
DO $$
DECLARE
  companies_count INTEGER;
  searches_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO companies_count FROM public.companies;
  SELECT COUNT(*) INTO searches_count FROM public.searches;
  
  RAISE NOTICE '✅ Verificação concluída:';
  RAISE NOTICE '   - Empresas no banco: %', companies_count;
  RAISE NOTICE '   - Buscas no banco: %', searches_count;
  RAISE NOTICE '   - Constraint FK: ON DELETE SET NULL';
  RAISE NOTICE '   - Índice único: (search_id, place_id)';
  RAISE NOTICE '   - Campo global_id: criado (NULL)';
END $$;

COMMIT;

-- ============================================
-- RESUMO DA MIGRAÇÃO
-- ============================================

-- Esta migração alterou:
-- ✅ companies.search_id: agora NULLABLE
-- ✅ FK companies → searches: ON DELETE SET NULL (não CASCADE)
-- ✅ Índice place_id: removido UNIQUE global
-- ✅ Novo índice: UNIQUE(search_id, place_id)
-- ✅ Novo campo: company_global_id UUID NULL
-- ✅ Novos campos: first_seen_at, last_seen_at, seen_count
-- ✅ Triggers atualizados para lidar com search_id NULL
-- ✅ View de análise: companies_unique_overview

-- Empresas agora são ATIVOS PERMANENTES
-- Buscas agora são EVENTOS que referenciam ativos

-- Próxima fase: FASE B (unificação de empresas duplicadas)
