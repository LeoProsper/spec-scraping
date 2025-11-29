-- ============================================
-- FASE B1 - CAMPOS COMERCIAIS EM COMPANIES
-- Data: 28/11/2025
-- Objetivo: Transformar companies em CRM completo
-- ============================================

-- ⚠️ REGRAS:
-- ✅ Apenas ALTER TABLE (não dropar tabela)
-- ✅ Campos NULLABLE (não quebrar dados existentes)
-- ✅ Sistema continua funcional

BEGIN;

-- ============================================
-- B1.1 - STATUS DE LEAD (PIPELINE)
-- ============================================

-- Adicionar campo lead_status com valores permitidos
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'novo';

-- Constraint para valores permitidos
ALTER TABLE public.companies 
  ADD CONSTRAINT companies_lead_status_check 
  CHECK (lead_status IN ('novo', 'contatado', 'qualificado', 'negociando', 'ganho', 'perdido'));

-- Índice para filtros rápidos por status
CREATE INDEX IF NOT EXISTS idx_companies_lead_status 
  ON public.companies(lead_status);

-- Comentário explicativo
COMMENT ON COLUMN public.companies.lead_status IS 
'Status no pipeline de vendas:
- novo: Lead recém-descoberto (padrão)
- contatado: Primeiro contato realizado
- qualificado: Lead validado como oportunidade real
- negociando: Em processo de negociação/proposta
- ganho: Deal fechado com sucesso
- perdido: Oportunidade perdida (pode ser reativada)';

-- ============================================
-- B1.2 - RESPONSÁVEL PELO LEAD
-- ============================================

-- Adicionar campo responsavel_id (quem está trabalhando este lead)
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS responsavel_id UUID NULL;

-- Foreign Key para accounts
ALTER TABLE public.companies 
  ADD CONSTRAINT companies_responsavel_id_fkey 
  FOREIGN KEY (responsavel_id) 
  REFERENCES public.accounts(id) 
  ON DELETE SET NULL;

-- Índice para buscar leads de um responsável
CREATE INDEX IF NOT EXISTS idx_companies_responsavel 
  ON public.companies(responsavel_id) 
  WHERE responsavel_id IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.companies.responsavel_id IS 
'ID do usuário responsável por trabalhar este lead.
NULL = lead não atribuído (disponível para qualquer um).
Útil para equipes comerciais dividirem territórios/carteiras.';

-- ============================================
-- B1.3 - TAGS E CATEGORIZAÇÃO
-- ============================================

-- Adicionar campo tags (array de strings)
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Índice GIN para buscas eficientes em arrays
CREATE INDEX IF NOT EXISTS idx_companies_tags 
  ON public.companies USING gin(tags);

-- Comentário explicativo
COMMENT ON COLUMN public.companies.tags IS 
'Tags customizáveis para categorização flexível.
Exemplos: ["cliente-premium", "interessado-cnpj", "follow-up-semana-3"]
Array vazio = sem tags.';

-- ============================================
-- B1.4 - ÚLTIMA INTERAÇÃO
-- ============================================

-- Adicionar campo ultima_interacao
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS ultima_interacao TIMESTAMPTZ NULL;

-- Índice para ordenação por última interação
CREATE INDEX IF NOT EXISTS idx_companies_ultima_interacao 
  ON public.companies(ultima_interacao DESC NULLS LAST);

-- Comentário explicativo
COMMENT ON COLUMN public.companies.ultima_interacao IS 
'Timestamp da última interação comercial com esta empresa.
Exemplos: último email, call, reunião, follow-up.
NULL = nunca houve interação (lead frio).
Atualizar manualmente ou via trigger de tabela de interações.';

-- ============================================
-- B1.5 - OBSERVAÇÕES INTERNAS
-- ============================================

-- Adicionar campo observacoes (notas livres)
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS observacoes TEXT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.companies.observacoes IS 
'Notas internas sobre o lead. Campo livre para informações qualitativas.
Exemplos:
- "CEO muito interessado em automação"
- "Orçamento limitado, aguardar Q2/2026"
- "Não atende telefone, preferir WhatsApp"';

-- ============================================
-- B1.6 - ESTÁGIO NO PIPELINE (CUSTOM)
-- ============================================

-- Adicionar campo pipeline_stage (estágio customizável)
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NULL;

-- Índice para agrupamento por estágio
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_stage 
  ON public.companies(pipeline_stage) 
  WHERE pipeline_stage IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.companies.pipeline_stage IS 
'Estágio customizável no pipeline de vendas.
Diferente de lead_status (fixo), este campo permite stages personalizados.
Exemplos:
- "Aguardando aprovação jurídica"
- "Proposta enviada - análise técnica"
- "Follow-up agendado 15/12"
NULL = usar apenas lead_status padrão.';

-- ============================================
-- B1.7 - VIEWS AUXILIARES PARA GESTÃO COMERCIAL
-- ============================================

-- View: Dashboard de Pipeline
CREATE OR REPLACE VIEW public.companies_pipeline_overview AS
SELECT 
  lead_status,
  COUNT(*) as total_leads,
  COUNT(DISTINCT responsavel_id) as responsaveis_ativos,
  COUNT(*) FILTER (WHERE ultima_interacao IS NOT NULL) as leads_com_interacao,
  COUNT(*) FILTER (WHERE ultima_interacao IS NULL) as leads_frios,
  AVG(EXTRACT(EPOCH FROM (NOW() - ultima_interacao)) / 86400)::INT as dias_media_sem_interacao
FROM public.companies
GROUP BY lead_status
ORDER BY 
  CASE lead_status
    WHEN 'novo' THEN 1
    WHEN 'contatado' THEN 2
    WHEN 'qualificado' THEN 3
    WHEN 'negociando' THEN 4
    WHEN 'ganho' THEN 5
    WHEN 'perdido' THEN 6
  END;

COMMENT ON VIEW public.companies_pipeline_overview IS 
'Dashboard agregado do pipeline comercial por status.
Útil para visualizações de funil de vendas.';

-- View: Leads por Responsável
CREATE OR REPLACE VIEW public.companies_por_responsavel AS
SELECT 
  r.id as responsavel_id,
  r.name as responsavel_nome,
  r.email as responsavel_email,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE c.lead_status = 'novo') as leads_novos,
  COUNT(*) FILTER (WHERE c.lead_status = 'contatado') as leads_contatados,
  COUNT(*) FILTER (WHERE c.lead_status = 'qualificado') as leads_qualificados,
  COUNT(*) FILTER (WHERE c.lead_status = 'negociando') as leads_negociando,
  COUNT(*) FILTER (WHERE c.lead_status = 'ganho') as leads_ganhos,
  COUNT(*) FILTER (WHERE c.lead_status = 'perdido') as leads_perdidos,
  MAX(c.ultima_interacao) as ultima_atividade
FROM public.companies c
JOIN public.accounts r ON c.responsavel_id = r.id
WHERE c.responsavel_id IS NOT NULL
GROUP BY r.id, r.name, r.email
ORDER BY total_leads DESC;

COMMENT ON VIEW public.companies_por_responsavel IS 
'Relatório de performance por responsável comercial.
Mostra distribuição de leads e última atividade.';

-- View: Leads Frios (Sem Interação Recente)
CREATE OR REPLACE VIEW public.companies_leads_frios AS
SELECT 
  id,
  name,
  place_id,
  lead_status,
  responsavel_id,
  ultima_interacao,
  EXTRACT(EPOCH FROM (NOW() - ultima_interacao)) / 86400 as dias_sem_interacao,
  tags,
  phone,
  website,
  receita_email
FROM public.companies
WHERE 
  ultima_interacao IS NOT NULL
  AND ultima_interacao < NOW() - INTERVAL '30 days'
  AND lead_status NOT IN ('ganho', 'perdido')
ORDER BY ultima_interacao ASC;

COMMENT ON VIEW public.companies_leads_frios IS 
'Leads que não recebem interação há mais de 30 dias.
Alerta para follow-up necessário.';

-- ============================================
-- B1.8 - TRIGGERS PARA AUTOMAÇÃO
-- ============================================

-- Trigger: Atualizar ultima_interacao automaticamente ao mudar status
CREATE OR REPLACE FUNCTION update_company_ultima_interacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se lead_status mudou (exceto para 'novo'), atualizar ultima_interacao
  IF NEW.lead_status IS DISTINCT FROM OLD.lead_status 
     AND NEW.lead_status != 'novo' THEN
    NEW.ultima_interacao = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS companies_auto_update_interacao ON public.companies;
CREATE TRIGGER companies_auto_update_interacao
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_ultima_interacao();

-- ============================================
-- B1.9 - ÍNDICES COMPOSTOS PARA QUERIES COMUNS
-- ============================================

-- Índice composto: responsavel + status (dashboard de vendedor)
CREATE INDEX IF NOT EXISTS idx_companies_responsavel_status 
  ON public.companies(responsavel_id, lead_status) 
  WHERE responsavel_id IS NOT NULL;

-- Índice composto: status + ultima_interacao (follow-ups prioritários)
CREATE INDEX IF NOT EXISTS idx_companies_status_interacao 
  ON public.companies(lead_status, ultima_interacao DESC NULLS LAST);

-- ============================================
-- B1.10 - FUNÇÃO AUXILIAR: ATRIBUIR RESPONSÁVEL
-- ============================================

-- Função: Atribuir lead para um responsável
CREATE OR REPLACE FUNCTION atribuir_lead_responsavel(
  p_company_id UUID,
  p_responsavel_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.companies
  SET 
    responsavel_id = p_responsavel_id,
    ultima_interacao = NOW()
  WHERE id = p_company_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION atribuir_lead_responsavel IS 
'Atribui um lead para um responsável e marca a interação.
Uso: SELECT atribuir_lead_responsavel(uuid_company, uuid_user);';

-- ============================================
-- B1.11 - POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Política: Usuário pode ver seus próprios leads
DROP POLICY IF EXISTS "companies_responsavel_read" ON public.companies;
CREATE POLICY "companies_responsavel_read" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    -- Leads sem responsável (disponíveis para todos)
    responsavel_id IS NULL
    OR
    -- Leads atribuídos ao usuário
    responsavel_id = auth.uid()
    OR
    -- Leads de buscas do próprio usuário (regra original)
    search_id IN (
      SELECT id FROM public.searches WHERE user_id = auth.uid()
    )
  );

-- Política: Usuário pode atualizar seus próprios leads
DROP POLICY IF EXISTS "companies_responsavel_update" ON public.companies;
CREATE POLICY "companies_responsavel_update" ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    responsavel_id = auth.uid()
    OR
    search_id IN (
      SELECT id FROM public.searches WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- B1.12 - VERIFICAÇÕES DE SEGURANÇA
-- ============================================

DO $$
DECLARE
  total_companies INTEGER;
  companies_com_status INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_companies FROM public.companies;
  SELECT COUNT(*) INTO companies_com_status 
  FROM public.companies 
  WHERE lead_status IS NOT NULL;
  
  RAISE NOTICE '✅ FASE B1 - Campos Comerciais Adicionados';
  RAISE NOTICE '   Total de empresas: %', total_companies;
  RAISE NOTICE '   Empresas com status: %', companies_com_status;
  RAISE NOTICE '   Novos campos: lead_status, responsavel_id, tags, ultima_interacao, observacoes, pipeline_stage';
  RAISE NOTICE '   Views criadas: 3 (pipeline_overview, por_responsavel, leads_frios)';
  RAISE NOTICE '   Triggers: auto_update_interacao';
  RAISE NOTICE '   Políticas RLS: atualizadas';
END $$;

COMMIT;

-- ============================================
-- RESUMO DA MIGRAÇÃO
-- ============================================

-- Esta migração adicionou 6 campos comerciais:
-- ✅ lead_status: Pipeline de vendas (novo → ganho/perdido)
-- ✅ responsavel_id: Atribuição de leads para vendedores
-- ✅ tags: Categorização flexível (array)
-- ✅ ultima_interacao: Rastreamento de follow-ups
-- ✅ observacoes: Notas internas qualitativas
-- ✅ pipeline_stage: Estágios customizáveis

-- Benefícios imediatos:
-- 🎯 CRM completo dentro de companies
-- 📊 Dashboards de pipeline
-- 👥 Gestão de equipe comercial
-- 🔔 Alertas de leads frios
-- 🔐 RLS por responsável

-- Próxima fase: B2 (Tabela de Interações/Histórico)
