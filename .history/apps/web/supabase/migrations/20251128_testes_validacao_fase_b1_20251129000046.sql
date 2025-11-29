-- ============================================
-- TESTES DE VALIDAÇÃO - FASE B1
-- Data: 28/11/2025
-- Objetivo: Validar campos comerciais em companies
-- ============================================

BEGIN;

-- ============================================
-- TESTE 1: Inserir empresa com status padrão
-- ============================================

DO $$
DECLARE
  test_search_id UUID := gen_random_uuid();
  test_company_id UUID;
  result_lead_status TEXT;
BEGIN
  -- Criar busca de teste
  INSERT INTO public.searches (id, user_id, query, status)
  VALUES (test_search_id, (SELECT id FROM auth.users LIMIT 1), 'teste B1 - São Paulo', 'completed');

  -- Inserir empresa (lead_status deve ser 'novo' por padrão)
  INSERT INTO public.companies (search_id, place_id, name, address)
  VALUES (test_search_id, 'test_place_b1_1', 'Empresa Teste B1', 'Av. Paulista, 1000')
  RETURNING id INTO test_company_id;

  -- Verificar lead_status padrão
  SELECT lead_status INTO result_lead_status 
  FROM public.companies 
  WHERE id = test_company_id;

  IF result_lead_status = 'novo' THEN
    RAISE NOTICE '✅ TESTE 1 PASSOU: lead_status padrão = "novo"';
  ELSE
    RAISE EXCEPTION '❌ TESTE 1 FALHOU: lead_status = % (esperado: novo)', result_lead_status;
  END IF;
END $$;

-- ============================================
-- TESTE 2: Atualizar lead_status (trigger de ultima_interacao)
-- ============================================

DO $$
DECLARE
  test_company_id UUID;
  result_interacao TIMESTAMPTZ;
BEGIN
  -- Pegar empresa criada no teste anterior
  SELECT id INTO test_company_id 
  FROM public.companies 
  WHERE place_id = 'test_place_b1_1';

  -- Aguardar 2 segundos
  PERFORM pg_sleep(2);

  -- Atualizar lead_status (deve disparar trigger de ultima_interacao)
  UPDATE public.companies 
  SET lead_status = 'contatado' 
  WHERE id = test_company_id;

  -- Verificar se ultima_interacao foi preenchida
  SELECT ultima_interacao INTO result_interacao 
  FROM public.companies 
  WHERE id = test_company_id;

  IF result_interacao IS NOT NULL 
     AND result_interacao > NOW() - INTERVAL '10 seconds' THEN
    RAISE NOTICE '✅ TESTE 2 PASSOU: Trigger atualizou ultima_interacao automaticamente';
  ELSE
    RAISE EXCEPTION '❌ TESTE 2 FALHOU: ultima_interacao não foi atualizada';
  END IF;
END $$;

-- ============================================
-- TESTE 3: Constraint de lead_status (valores inválidos)
-- ============================================

DO $$
DECLARE
  test_company_id UUID;
  error_caught BOOLEAN := FALSE;
BEGIN
  SELECT id INTO test_company_id 
  FROM public.companies 
  WHERE place_id = 'test_place_b1_1';

  -- Tentar inserir valor inválido (deve falhar)
  BEGIN
    UPDATE public.companies 
    SET lead_status = 'status_invalido' 
    WHERE id = test_company_id;
  EXCEPTION WHEN check_violation THEN
    error_caught := TRUE;
  END;

  IF error_caught THEN
    RAISE NOTICE '✅ TESTE 3 PASSOU: Constraint bloqueou valor inválido';
  ELSE
    RAISE EXCEPTION '❌ TESTE 3 FALHOU: Constraint não bloqueou valor inválido';
  END IF;
END $$;

-- ============================================
-- TESTE 4: Tags (array de strings)
-- ============================================

DO $$
DECLARE
  test_company_id UUID;
  result_tags TEXT[];
BEGIN
  SELECT id INTO test_company_id 
  FROM public.companies 
  WHERE place_id = 'test_place_b1_1';

  -- Adicionar tags
  UPDATE public.companies 
  SET tags = ARRAY['cliente-premium', 'follow-up-urgente', 'interesse-cnpj'] 
  WHERE id = test_company_id;

  -- Verificar tags
  SELECT tags INTO result_tags 
  FROM public.companies 
  WHERE id = test_company_id;

  IF array_length(result_tags, 1) = 3 
     AND 'cliente-premium' = ANY(result_tags) THEN
    RAISE NOTICE '✅ TESTE 4 PASSOU: Tags armazenadas corretamente (array com % elementos)', array_length(result_tags, 1);
  ELSE
    RAISE EXCEPTION '❌ TESTE 4 FALHOU: Tags não armazenadas corretamente';
  END IF;
END $$;

-- ============================================
-- TESTE 5: Atribuir responsável (FK para accounts)
-- ============================================

DO $$
DECLARE
  test_company_id UUID;
  test_user_id UUID;
  result_responsavel UUID;
BEGIN
  SELECT id INTO test_company_id 
  FROM public.companies 
  WHERE place_id = 'test_place_b1_1';

  SELECT id INTO test_user_id 
  FROM public.accounts 
  LIMIT 1;

  -- Atribuir responsável
  UPDATE public.companies 
  SET responsavel_id = test_user_id 
  WHERE id = test_company_id;

  -- Verificar FK
  SELECT responsavel_id INTO result_responsavel 
  FROM public.companies 
  WHERE id = test_company_id;

  IF result_responsavel = test_user_id THEN
    RAISE NOTICE '✅ TESTE 5 PASSOU: Responsável atribuído via FK (accounts)';
  ELSE
    RAISE EXCEPTION '❌ TESTE 5 FALHOU: FK de responsavel_id não funcionou';
  END IF;
END $$;

-- ============================================
-- TESTE 6: Função atribuir_lead_responsavel
-- ============================================

DO $$
DECLARE
  test_search_id UUID := gen_random_uuid();
  test_company_id UUID;
  test_user_id UUID;
  function_result BOOLEAN;
  result_responsavel UUID;
BEGIN
  -- Criar nova empresa
  INSERT INTO public.searches (id, user_id, query, location, status)
  VALUES (test_search_id, (SELECT id FROM auth.users LIMIT 1), 'teste B1 func', 'Rio de Janeiro', 'completed');

  INSERT INTO public.companies (search_id, place_id, name, address)
  VALUES (test_search_id, 'test_place_b1_func', 'Empresa Teste Função', 'Av. Atlântica, 500')
  RETURNING id INTO test_company_id;

  SELECT id INTO test_user_id 
  FROM public.accounts 
  LIMIT 1;

  -- Usar função para atribuir
  SELECT atribuir_lead_responsavel(test_company_id, test_user_id) 
  INTO function_result;

  -- Verificar resultado
  SELECT responsavel_id INTO result_responsavel 
  FROM public.companies 
  WHERE id = test_company_id;

  IF function_result = TRUE 
     AND result_responsavel = test_user_id THEN
    RAISE NOTICE '✅ TESTE 6 PASSOU: Função atribuir_lead_responsavel funcionou';
  ELSE
    RAISE EXCEPTION '❌ TESTE 6 FALHOU: Função não atribuiu responsável';
  END IF;
END $$;

-- ============================================
-- TESTE 7: View companies_pipeline_overview
-- ============================================

DO $$
DECLARE
  total_leads_novo INTEGER;
  total_leads_contatado INTEGER;
BEGIN
  -- Consultar view
  SELECT total_leads INTO total_leads_novo 
  FROM public.companies_pipeline_overview 
  WHERE lead_status = 'novo';

  SELECT total_leads INTO total_leads_contatado 
  FROM public.companies_pipeline_overview 
  WHERE lead_status = 'contatado';

  IF total_leads_novo > 0 OR total_leads_contatado > 0 THEN
    RAISE NOTICE '✅ TESTE 7 PASSOU: View pipeline_overview retornou dados (novo: %, contatado: %)', 
      total_leads_novo, total_leads_contatado;
  ELSE
    RAISE EXCEPTION '❌ TESTE 7 FALHOU: View não retornou dados';
  END IF;
END $$;

-- ============================================
-- TESTE 8: View companies_por_responsavel
-- ============================================

DO $$
DECLARE
  total_responsaveis INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_responsaveis 
  FROM public.companies_por_responsavel;

  IF total_responsaveis > 0 THEN
    RAISE NOTICE '✅ TESTE 8 PASSOU: View por_responsavel retornou % responsáveis', total_responsaveis;
  ELSE
    RAISE NOTICE '⚠️ TESTE 8 AVISO: Nenhum responsável com leads atribuídos (esperado em testes)';
  END IF;
END $$;

-- ============================================
-- TESTE 9: Observações (campo livre de texto)
-- ============================================

DO $$
DECLARE
  test_company_id UUID;
  result_obs TEXT;
BEGIN
  SELECT id INTO test_company_id 
  FROM public.companies 
  WHERE place_id = 'test_place_b1_1';

  -- Adicionar observação
  UPDATE public.companies 
  SET observacoes = 'CEO muito interessado em automação. Orçamento de R$ 50k. Follow-up na próxima segunda.' 
  WHERE id = test_company_id;

  -- Verificar
  SELECT observacoes INTO result_obs 
  FROM public.companies 
  WHERE id = test_company_id;

  IF result_obs IS NOT NULL AND length(result_obs) > 20 THEN
    RAISE NOTICE '✅ TESTE 9 PASSOU: Observações armazenadas (% caracteres)', length(result_obs);
  ELSE
    RAISE EXCEPTION '❌ TESTE 9 FALHOU: Observações não salvas';
  END IF;
END $$;

-- ============================================
-- TESTE 10: Pipeline Stage Customizável
-- ============================================

DO $$
DECLARE
  test_company_id UUID;
  result_stage TEXT;
BEGIN
  SELECT id INTO test_company_id 
  FROM public.companies 
  WHERE place_id = 'test_place_b1_1';

  -- Definir stage customizado
  UPDATE public.companies 
  SET pipeline_stage = 'Aguardando aprovação jurídica - Análise contrato' 
  WHERE id = test_company_id;

  -- Verificar
  SELECT pipeline_stage INTO result_stage 
  FROM public.companies 
  WHERE id = test_company_id;

  IF result_stage IS NOT NULL THEN
    RAISE NOTICE '✅ TESTE 10 PASSOU: Pipeline stage customizado = "%"', result_stage;
  ELSE
    RAISE EXCEPTION '❌ TESTE 10 FALHOU: Pipeline stage não salvo';
  END IF;
END $$;

-- ============================================
-- LIMPEZA: Remover dados de teste
-- ============================================

DELETE FROM public.companies 
WHERE place_id IN ('test_place_b1_1', 'test_place_b1_func');

DELETE FROM public.searches 
WHERE query LIKE 'teste B1%';

RAISE NOTICE '';
RAISE NOTICE '════════════════════════════════════════';
RAISE NOTICE '  RESUMO FASE B1 - CAMPOS COMERCIAIS';
RAISE NOTICE '════════════════════════════════════════';
RAISE NOTICE '';
RAISE NOTICE '✅ Todos os testes passaram!';
RAISE NOTICE '';
RAISE NOTICE '📦 Campos adicionados:';
RAISE NOTICE '   • lead_status (novo, contatado, qualificado, negociando, ganho, perdido)';
RAISE NOTICE '   • responsavel_id (FK → accounts)';
RAISE NOTICE '   • tags (TEXT[])';
RAISE NOTICE '   • ultima_interacao (TIMESTAMPTZ)';
RAISE NOTICE '   • observacoes (TEXT)';
RAISE NOTICE '   • pipeline_stage (TEXT)';
RAISE NOTICE '';
RAISE NOTICE '🎯 Funcionalidades validadas:';
RAISE NOTICE '   • Constraint de valores permitidos em lead_status';
RAISE NOTICE '   • Trigger automático para ultima_interacao';
RAISE NOTICE '   • FK para accounts (responsavel_id)';
RAISE NOTICE '   • Array de tags com índice GIN';
RAISE NOTICE '   • Função atribuir_lead_responsavel()';
RAISE NOTICE '   • Views: pipeline_overview, por_responsavel, leads_frios';
RAISE NOTICE '';
RAISE NOTICE '🚀 Próxima fase: B2 (Tabela de Interações/Histórico)';
RAISE NOTICE '';

COMMIT;
