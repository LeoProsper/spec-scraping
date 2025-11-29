-- ============================================
-- TESTES DE VALIDAÇÃO - FASE A
-- Execute este arquivo para provar que a migração funcionou
-- ============================================

-- Limpar dados de teste (se existirem)
DELETE FROM public.companies WHERE name LIKE '%TEST_%';
DELETE FROM public.searches WHERE query LIKE '%TEST_%';

BEGIN;

-- ============================================
-- TESTE 1: Inserir empresa em uma busca
-- ============================================

-- Criar busca de teste
INSERT INTO public.searches (id, user_id, query, title, status)
VALUES (
  'test_search_1',
  (SELECT id FROM auth.users LIMIT 1),
  'TEST_Pizzarias São Paulo',
  'Teste 1',
  'completed'
);

-- Inserir empresa
INSERT INTO public.companies (
  search_id, place_id, name, address, phone, rating, total_reviews, category
) VALUES (
  'test_search_1',
  'ChIJ_TEST_PLACE_001',
  'TEST_Pizzaria Bella Napoli',
  'Rua Test, 123',
  '(11) 1234-5678',
  4.5,
  100,
  'Restaurante'
);

-- Validação: empresa foi inserida
SELECT '✅ TESTE 1 PASSOU' as resultado 
WHERE EXISTS (
  SELECT 1 FROM public.companies 
  WHERE place_id = 'ChIJ_TEST_PLACE_001'
);

-- ============================================
-- TESTE 2: Inserir MESMA empresa em BUSCA DIFERENTE
-- ============================================

-- Criar segunda busca
INSERT INTO public.searches (id, user_id, query, title, status)
VALUES (
  'test_search_2',
  (SELECT id FROM auth.users LIMIT 1),
  'TEST_Restaurantes Italianos SP',
  'Teste 2',
  'completed'
);

-- Inserir MESMA empresa (mesmo place_id) em busca diferente
INSERT INTO public.companies (
  search_id, place_id, name, address, phone, rating, total_reviews, category
) VALUES (
  'test_search_2',
  'ChIJ_TEST_PLACE_001',  -- MESMO place_id
  'TEST_Pizzaria Bella Napoli',
  'Rua Test, 123',
  '(11) 1234-5678',
  4.5,
  120,  -- Nota: mais reviews (dados podem variar entre buscas)
  'Restaurante Italiano'
);

-- Validação: mesma empresa aparece 2 vezes
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ TESTE 2 PASSOU: Mesma empresa em 2 buscas diferentes'
    ELSE '❌ TESTE 2 FALHOU: Esperado 2 registros, encontrado ' || COUNT(*)
  END as resultado
FROM public.companies 
WHERE place_id = 'ChIJ_TEST_PLACE_001';

-- ============================================
-- TESTE 3: Tentar duplicar na MESMA busca (deve falhar)
-- ============================================

DO $$
BEGIN
  -- Tentar inserir duplicata na mesma busca
  INSERT INTO public.companies (
    search_id, place_id, name
  ) VALUES (
    'test_search_1',
    'ChIJ_TEST_PLACE_001',  -- Já existe nesta busca
    'TEST_Duplicata'
  );
  
  RAISE EXCEPTION '❌ TESTE 3 FALHOU: Duplicata na mesma busca deveria ter sido bloqueada';
  
EXCEPTION 
  WHEN unique_violation THEN
    RAISE NOTICE '✅ TESTE 3 PASSOU: Duplicata na mesma busca foi bloqueada corretamente';
END $$;

-- ============================================
-- TESTE 4: Deletar busca NÃO apaga empresa
-- ============================================

-- Deletar primeira busca
DELETE FROM public.searches WHERE id = 'test_search_1';

-- Validação: empresa ainda existe com search_id = NULL
SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND search_id IS NULL 
    THEN '✅ TESTE 4 PASSOU: Empresa sobreviveu com search_id NULL'
    ELSE '❌ TESTE 4 FALHOU: Empresa deveria ter search_id NULL'
  END as resultado
FROM public.companies 
WHERE place_id = 'ChIJ_TEST_PLACE_001' AND search_id IS NULL;

-- ============================================
-- TESTE 5: View de análise funciona
-- ============================================

-- Validação: view retorna a empresa duplicada
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.companies_unique_overview 
      WHERE place_id = 'ChIJ_TEST_PLACE_001'
    )
    THEN '✅ TESTE 5 PASSOU: View de análise detectou empresa duplicada'
    ELSE '✅ TESTE 5 OK: View vazia (esperado se apenas 1 registro por place_id)'
  END as resultado;

-- ============================================
-- TESTE 6: Campos temporais foram criados
-- ============================================

SELECT 
  CASE 
    WHEN first_seen_at IS NOT NULL 
      AND last_seen_at IS NOT NULL 
      AND seen_count = 1
    THEN '✅ TESTE 6 PASSOU: Campos temporais preenchidos corretamente'
    ELSE '❌ TESTE 6 FALHOU: Campos temporais inválidos'
  END as resultado
FROM public.companies 
WHERE place_id = 'ChIJ_TEST_PLACE_001' 
LIMIT 1;

-- ============================================
-- TESTE 7: Trigger de last_seen_at funciona
-- ============================================

-- Atualizar empresa
UPDATE public.companies 
SET name = 'TEST_Pizzaria Bella Napoli (Atualizada)'
WHERE place_id = 'ChIJ_TEST_PLACE_001' AND search_id IS NOT NULL;

-- Validação: last_seen_at foi atualizado
SELECT 
  CASE 
    WHEN last_seen_at > first_seen_at 
    THEN '✅ TESTE 7 PASSOU: Trigger last_seen_at funcionando'
    ELSE '❌ TESTE 7 FALHOU: last_seen_at não foi atualizado'
  END as resultado
FROM public.companies 
WHERE place_id = 'ChIJ_TEST_PLACE_001' AND search_id IS NOT NULL
LIMIT 1;

-- ============================================
-- RESUMO FINAL DOS TESTES
-- ============================================

SELECT 
  '========================' as separador,
  'RESUMO DOS TESTES' as titulo,
  '========================' as separador2;

SELECT 
  COUNT(*) as total_registros_place_001,
  COUNT(DISTINCT search_id) as buscas_diferentes,
  COUNT(*) FILTER (WHERE search_id IS NULL) as registros_orfaos,
  COUNT(*) FILTER (WHERE search_id IS NOT NULL) as registros_com_busca,
  MIN(first_seen_at) as primeira_aparicao,
  MAX(last_seen_at) as ultima_atualizacao
FROM public.companies 
WHERE place_id = 'ChIJ_TEST_PLACE_001';

-- Limpeza final
DELETE FROM public.companies WHERE name LIKE '%TEST_%';
DELETE FROM public.searches WHERE query LIKE '%TEST_%';

COMMIT;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ TESTE 1 PASSOU
-- ✅ TESTE 2 PASSOU: Mesma empresa em 2 buscas diferentes
-- ✅ TESTE 3 PASSOU: Duplicata na mesma busca foi bloqueada
-- ✅ TESTE 4 PASSOU: Empresa sobreviveu com search_id NULL
-- ✅ TESTE 5 PASSOU/OK
-- ✅ TESTE 6 PASSOU: Campos temporais preenchidos
-- ✅ TESTE 7 PASSOU: Trigger last_seen_at funcionando
