-- ============================================
-- FIX: Permissões da função criar_lista_de_template
-- ============================================
-- Data: 2024-11-29
-- Descrição: Corrige permissões de execução da função criar_lista_de_template
-- ============================================

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.criar_lista_de_template(UUID, UUID, TEXT) TO authenticated;

-- Conceder permissão de execução para o service_role (admin)
GRANT EXECUTE ON FUNCTION public.criar_lista_de_template(UUID, UUID, TEXT) TO service_role;

-- Também garantir permissões para a função adicionar_empresa_lista
GRANT EXECUTE ON FUNCTION public.adicionar_empresa_lista(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adicionar_empresa_lista(UUID, UUID, INTEGER, TEXT) TO service_role;

-- Comentário
COMMENT ON FUNCTION public.criar_lista_de_template IS 
'Cria uma lista nova para o usuário baseada em um template.
Útil para ativação rápida de clientes.
Permissões: authenticated, service_role';
