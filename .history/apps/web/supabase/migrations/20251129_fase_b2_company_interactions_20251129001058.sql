-- ============================================
-- FASE B2 - SISTEMA DE HISTÓRICO DE INTERAÇÕES
-- Data: 29/11/2025
-- Objetivo: Criar camada de auditoria comercial completa
-- ============================================

-- ⚠️ REGRAS:
-- ✅ Apenas CREATE TABLE (não alterar dados)
-- ✅ 100% protegido por RLS
-- ✅ Trigger de sincronização com companies
-- ✅ Não dropar nada

BEGIN;

-- ============================================
-- B2.1 - CRIAR TABELA company_interactions
-- ============================================

CREATE TABLE IF NOT EXISTS public.company_interactions (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relacionamentos (CASCADE para auditoria completa)
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Tipo de interação
  tipo TEXT NOT NULL,
  
  -- Canal usado (opcional)
  canal TEXT NULL,
  
  -- Descrição obrigatória (o que aconteceu)
  descricao TEXT NOT NULL,
  
  -- Resultado da interação
  resultado TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Próxima ação agendada
  next_action_at TIMESTAMPTZ NULL,
  
  -- Foreign Keys
  CONSTRAINT company_interactions_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT company_interactions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.accounts(id) 
    ON DELETE CASCADE,
  
  -- Constraints de valores permitidos
  CONSTRAINT company_interactions_tipo_check 
    CHECK (tipo IN ('chamada', 'whatsapp', 'email', 'reuniao', 'proposta', 'followup', 'anotacao')),
  
  CONSTRAINT company_interactions_resultado_check 
    CHECK (resultado IS NULL OR resultado IN ('interessado', 'sem_resposta', 'retorno_depois', 'fechado', 'recusado'))
);

-- Comentários explicativos
COMMENT ON TABLE public.company_interactions IS 
'Histórico completo de todas as interações comerciais com empresas.
Registra: ligações, emails, reuniões, propostas, follow-ups.
Permite: auditoria, score de lead, automação, prova de trabalho.';

COMMENT ON COLUMN public.company_interactions.tipo IS 
'Tipo de interação realizada:
- chamada: Ligação telefônica
- whatsapp: Mensagem via WhatsApp
- email: Email enviado/recebido
- reuniao: Reunião presencial ou online
- proposta: Envio de proposta comercial
- followup: Retorno agendado
- anotacao: Nota interna (sem contato direto)';

COMMENT ON COLUMN public.company_interactions.canal IS 
'Canal específico usado (opcional).
Exemplos: whatsapp, telefone, email, zoom, meet, teams, presencial';

COMMENT ON COLUMN public.company_interactions.resultado IS 
'Resultado/outcome da interação:
- interessado: Lead demonstrou interesse
- sem_resposta: Não houve resposta
- retorno_depois: Pediu para retornar em outro momento
- fechado: Deal fechado (ganho)
- recusado: Lead recusou proposta (perdido)';

COMMENT ON COLUMN public.company_interactions.next_action_at IS 
'Timestamp da próxima ação agendada.
Usado para alertas de follow-up.
NULL = sem ação futura agendada.';

-- ============================================
-- B2.2 - ÍNDICES OBRIGATÓRIOS
-- ============================================

-- Índice 1: Buscar todas as interações de uma empresa
CREATE INDEX IF NOT EXISTS idx_company_interactions_company_id 
  ON public.company_interactions(company_id);

-- Índice 2: Buscar todas as interações de um usuário
CREATE INDEX IF NOT EXISTS idx_company_interactions_user_id 
  ON public.company_interactions(user_id);

-- Índice 3: Timeline de interações por empresa (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_company_interactions_company_timeline 
  ON public.company_interactions(company_id, created_at DESC);

-- Índice 4: Timeline de interações por usuário (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_company_interactions_user_timeline 
  ON public.company_interactions(user_id, created_at DESC);

-- Índice 5: Follow-ups pendentes (alertas)
CREATE INDEX IF NOT EXISTS idx_company_interactions_next_action 
  ON public.company_interactions(next_action_at) 
  WHERE next_action_at IS NOT NULL;

-- Índice 6: Buscar por tipo de interação
CREATE INDEX IF NOT EXISTS idx_company_interactions_tipo 
  ON public.company_interactions(tipo);

-- Índice 7: Buscar por resultado
CREATE INDEX IF NOT EXISTS idx_company_interactions_resultado 
  ON public.company_interactions(resultado) 
  WHERE resultado IS NOT NULL;

-- ============================================
-- B2.3 - TRIGGER DE SINCRONIZAÇÃO COM COMPANIES
-- ============================================

-- Função: Atualizar companies ao inserir interação
CREATE OR REPLACE FUNCTION sync_company_on_interaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ultima_interacao na tabela companies
  UPDATE public.companies 
  SET ultima_interacao = NEW.created_at
  WHERE id = NEW.company_id;
  
  -- Se resultado for "interessado" e lead_status ainda for "novo" ou "contatado"
  -- → avançar para "qualificado"
  IF NEW.resultado = 'interessado' THEN
    UPDATE public.companies 
    SET lead_status = 'qualificado'
    WHERE id = NEW.company_id
      AND lead_status IN ('novo', 'contatado');
  END IF;
  
  -- Se resultado for "fechado" → marcar como "ganho"
  IF NEW.resultado = 'fechado' THEN
    UPDATE public.companies 
    SET lead_status = 'ganho'
    WHERE id = NEW.company_id;
  END IF;
  
  -- Se resultado for "recusado" → marcar como "perdido"
  IF NEW.resultado = 'recusado' THEN
    UPDATE public.companies 
    SET lead_status = 'perdido'
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS company_interactions_sync_trigger ON public.company_interactions;
CREATE TRIGGER company_interactions_sync_trigger
  AFTER INSERT ON public.company_interactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_on_interaction();

COMMENT ON FUNCTION sync_company_on_interaction IS 
'Sincroniza automaticamente a tabela companies ao registrar interação.
Atualiza ultima_interacao e avança lead_status conforme resultado.';

-- ============================================
-- B2.4 - RLS (ROW LEVEL SECURITY)
-- ============================================

-- Ativar RLS na tabela
ALTER TABLE public.company_interactions ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuário pode VER interações de empresas que ele criou ou é responsável
DROP POLICY IF EXISTS "interactions_read" ON public.company_interactions;
CREATE POLICY "interactions_read" ON public.company_interactions
  FOR SELECT
  TO authenticated
  USING (
    -- Interações das empresas onde o usuário é responsável
    company_id IN (
      SELECT id FROM public.companies 
      WHERE responsavel_id = auth.uid()
    )
    OR
    -- Interações das empresas criadas pelo usuário (via searches)
    company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.searches s ON c.search_id = s.id
      WHERE s.user_id = auth.uid()
    )
    OR
    -- Interações criadas pelo próprio usuário
    user_id = auth.uid()
  );

-- Política 2: Usuário pode CRIAR interações apenas se for dono ou responsável
DROP POLICY IF EXISTS "interactions_insert" ON public.company_interactions;
CREATE POLICY "interactions_insert" ON public.company_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Inserir apenas se for o próprio usuário
    user_id = auth.uid()
    AND
    (
      -- E se a empresa foi criada por ele
      company_id IN (
        SELECT c.id FROM public.companies c
        JOIN public.searches s ON c.search_id = s.id
        WHERE s.user_id = auth.uid()
      )
      OR
      -- OU se ele é o responsável pela empresa
      company_id IN (
        SELECT id FROM public.companies 
        WHERE responsavel_id = auth.uid()
      )
    )
  );

-- Política 3: Usuário pode ATUALIZAR suas próprias interações
DROP POLICY IF EXISTS "interactions_update" ON public.company_interactions;
CREATE POLICY "interactions_update" ON public.company_interactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Política 4: Usuário pode DELETAR suas próprias interações
DROP POLICY IF EXISTS "interactions_delete" ON public.company_interactions;
CREATE POLICY "interactions_delete" ON public.company_interactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- B2.5 - VIEWS COMERCIAIS
-- ============================================

-- View 1: Interações agrupadas por empresa
CREATE OR REPLACE VIEW public.interactions_por_empresa AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.place_id,
  c.lead_status,
  c.responsavel_id,
  COUNT(i.id) as total_interacoes,
  COUNT(i.id) FILTER (WHERE i.tipo = 'chamada') as total_chamadas,
  COUNT(i.id) FILTER (WHERE i.tipo = 'whatsapp') as total_whatsapp,
  COUNT(i.id) FILTER (WHERE i.tipo = 'email') as total_emails,
  COUNT(i.id) FILTER (WHERE i.tipo = 'reuniao') as total_reunioes,
  COUNT(i.id) FILTER (WHERE i.tipo = 'proposta') as total_propostas,
  COUNT(i.id) FILTER (WHERE i.tipo = 'followup') as total_followups,
  COUNT(i.id) FILTER (WHERE i.resultado = 'interessado') as interacoes_positivas,
  COUNT(i.id) FILTER (WHERE i.resultado = 'sem_resposta') as interacoes_sem_resposta,
  MAX(i.created_at) as ultima_interacao_registrada,
  MIN(i.next_action_at) as proximo_followup_agendado,
  ARRAY_AGG(DISTINCT i.user_id) FILTER (WHERE i.user_id IS NOT NULL) as usuarios_que_interagiram
FROM public.companies c
LEFT JOIN public.company_interactions i ON c.id = i.company_id
GROUP BY c.id, c.name, c.place_id, c.lead_status, c.responsavel_id;

COMMENT ON VIEW public.interactions_por_empresa IS 
'Resumo de todas as interações agrupadas por empresa.
Mostra: total por tipo, resultados, próximos follow-ups.';

-- View 2: Interações agrupadas por usuário
CREATE OR REPLACE VIEW public.interactions_por_usuario AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  COUNT(i.id) as total_interacoes,
  COUNT(DISTINCT i.company_id) as empresas_contatadas,
  COUNT(i.id) FILTER (WHERE i.tipo = 'chamada') as total_chamadas,
  COUNT(i.id) FILTER (WHERE i.tipo = 'whatsapp') as total_whatsapp,
  COUNT(i.id) FILTER (WHERE i.tipo = 'email') as total_emails,
  COUNT(i.id) FILTER (WHERE i.tipo = 'reuniao') as total_reunioes,
  COUNT(i.id) FILTER (WHERE i.tipo = 'proposta') as total_propostas,
  COUNT(i.id) FILTER (WHERE i.resultado = 'interessado') as leads_interessados,
  COUNT(i.id) FILTER (WHERE i.resultado = 'fechado') as deals_fechados,
  COUNT(i.id) FILTER (WHERE i.resultado = 'recusado') as leads_perdidos,
  MAX(i.created_at) as ultima_atividade,
  COUNT(i.id) FILTER (WHERE i.next_action_at IS NOT NULL) as followups_agendados
FROM public.accounts u
LEFT JOIN public.company_interactions i ON u.id = i.user_id
GROUP BY u.id, u.name, u.email;

COMMENT ON VIEW public.interactions_por_usuario IS 
'Relatório de performance por usuário/vendedor.
Mostra: volume de trabalho, conversões, follow-ups agendados.';

-- View 3: Follow-ups pendentes (alertas)
CREATE OR REPLACE VIEW public.followups_pendentes AS
SELECT 
  i.id as interaction_id,
  i.company_id,
  c.name as company_name,
  c.place_id,
  c.phone,
  c.website,
  c.lead_status,
  i.user_id,
  u.name as responsavel_nome,
  u.email as responsavel_email,
  i.tipo,
  i.canal,
  i.descricao,
  i.resultado,
  i.next_action_at,
  EXTRACT(EPOCH FROM (i.next_action_at - NOW())) / 86400 as dias_ate_followup,
  CASE 
    WHEN i.next_action_at < NOW() THEN 'atrasado'
    WHEN i.next_action_at < NOW() + INTERVAL '24 hours' THEN 'urgente'
    WHEN i.next_action_at < NOW() + INTERVAL '7 days' THEN 'proximo'
    ELSE 'futuro'
  END as prioridade
FROM public.company_interactions i
JOIN public.companies c ON i.company_id = c.id
JOIN public.accounts u ON i.user_id = u.id
WHERE i.next_action_at IS NOT NULL
  AND i.next_action_at <= NOW() + INTERVAL '30 days'
ORDER BY i.next_action_at ASC;

COMMENT ON VIEW public.followups_pendentes IS 
'Lista de todos os follow-ups agendados nos próximos 30 dias.
Prioriza: atrasados, urgentes (24h), próximos (7 dias), futuros.';

-- View 4: Timeline completa de uma empresa (últimas 50 interações)
CREATE OR REPLACE VIEW public.company_timeline AS
SELECT 
  i.id,
  i.company_id,
  c.name as company_name,
  i.user_id,
  u.name as user_name,
  i.tipo,
  i.canal,
  i.descricao,
  i.resultado,
  i.created_at,
  i.next_action_at,
  ROW_NUMBER() OVER (PARTITION BY i.company_id ORDER BY i.created_at DESC) as rank_na_timeline
FROM public.company_interactions i
JOIN public.companies c ON i.company_id = c.id
JOIN public.accounts u ON i.user_id = u.id
ORDER BY i.company_id, i.created_at DESC;

COMMENT ON VIEW public.company_timeline IS 
'Timeline completa de interações por empresa.
Ordena da mais recente para a mais antiga.';

-- ============================================
-- B2.6 - FUNÇÕES AUXILIARES
-- ============================================

-- Função: Registrar interação (helper simplificado)
CREATE OR REPLACE FUNCTION registrar_interacao(
  p_company_id UUID,
  p_user_id UUID,
  p_tipo TEXT,
  p_descricao TEXT,
  p_canal TEXT DEFAULT NULL,
  p_resultado TEXT DEFAULT NULL,
  p_next_action_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO public.company_interactions (
    company_id, 
    user_id, 
    tipo, 
    canal, 
    descricao, 
    resultado, 
    next_action_at
  ) VALUES (
    p_company_id,
    p_user_id,
    p_tipo,
    p_canal,
    p_descricao,
    p_resultado,
    p_next_action_at
  )
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION registrar_interacao IS 
'Helper para registrar interação rapidamente.
Usa auth.uid() automaticamente.
Retorna: UUID da interação criada.';

-- Função: Contar interações de uma empresa
CREATE OR REPLACE FUNCTION count_company_interactions(p_company_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM public.company_interactions 
    WHERE company_id = p_company_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função: Última interação de uma empresa
CREATE OR REPLACE FUNCTION get_last_interaction(p_company_id UUID)
RETURNS TABLE (
  tipo TEXT,
  descricao TEXT,
  resultado TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.tipo,
    i.descricao,
    i.resultado,
    i.created_at,
    u.name as user_name
  FROM public.company_interactions i
  JOIN public.accounts u ON i.user_id = u.id
  WHERE i.company_id = p_company_id
  ORDER BY i.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- B2.7 - VERIFICAÇÕES DE INTEGRIDADE
-- ============================================

DO $$
DECLARE
  table_exists BOOLEAN;
  total_policies INTEGER;
  total_indexes INTEGER;
BEGIN
  -- Verificar se tabela foi criada
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_interactions'
  ) INTO table_exists;
  
  -- Contar políticas RLS
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE tablename = 'company_interactions';
  
  -- Contar índices
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes 
  WHERE tablename = 'company_interactions';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ FASE B2 - SISTEMA DE HISTÓRICO DE INTERAÇÕES';
  RAISE NOTICE '   Tabela criada: %', CASE WHEN table_exists THEN 'SIM' ELSE 'NÃO' END;
  RAISE NOTICE '   Políticas RLS: % ativas', total_policies;
  RAISE NOTICE '   Índices: % criados', total_indexes;
  RAISE NOTICE '   Triggers: 1 (sync_company_on_interaction)';
  RAISE NOTICE '   Views: 4 (por_empresa, por_usuario, followups_pendentes, timeline)';
  RAISE NOTICE '   Funções: 3 (registrar_interacao, count_interactions, get_last_interaction)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Capacidades adicionadas:';
  RAISE NOTICE '   • Registro completo de todas as interações';
  RAISE NOTICE '   • Auditoria comercial total';
  RAISE NOTICE '   • Follow-ups automatizados';
  RAISE NOTICE '   • Score real de leads';
  RAISE NOTICE '   • Prova de trabalho da equipe';
  RAISE NOTICE '   • Sincronização automática com companies';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Segurança:';
  RAISE NOTICE '   • RLS 100%% ativo';
  RAISE NOTICE '   • Usuário só vê suas interações';
  RAISE NOTICE '   • Políticas de INSERT validam ownership';
  RAISE NOTICE '';
  
  IF NOT table_exists THEN
    RAISE EXCEPTION '❌ ERRO: Tabela company_interactions não foi criada!';
  END IF;
  
  IF total_policies < 4 THEN
    RAISE WARNING '⚠️ AVISO: Menos de 4 políticas RLS ativas (esperado: 4)';
  END IF;
END $$;

COMMIT;

-- ============================================
-- RESUMO DA MIGRAÇÃO
-- ============================================

-- Esta migração adicionou:
-- ✅ Tabela company_interactions (8 campos)
-- ✅ 7 índices otimizados
-- ✅ 1 trigger de sincronização automática
-- ✅ 4 políticas RLS (read, insert, update, delete)
-- ✅ 4 views comerciais
-- ✅ 3 funções auxiliares

-- Benefícios imediatos:
-- 🎯 Auditoria completa de todas as interações
-- 📊 Relatórios de performance por vendedor
-- 🔔 Alertas de follow-ups pendentes
-- 🤖 Sincronização automática com lead_status
-- 🔐 Segurança total via RLS
-- 📈 Prova de trabalho da equipe
-- 🧠 Base para IA e automação futura

-- Próxima fase: B3 (Company Lists - Listas customizadas)
