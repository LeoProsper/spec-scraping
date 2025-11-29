-- =====================================================
-- MIGRATION: Sistema de Buscador de Oportunidades B2B
-- Data: 2025-11-29
-- Descrição: Tabelas para geração de prompts estratégicos de prospecção
-- =====================================================

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.opportunity_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Prompts
CREATE TABLE IF NOT EXISTS public.opportunity_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.opportunity_categories(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  pain_point TEXT NOT NULL,
  data_sources TEXT[] DEFAULT '{}', -- Tags: google_maps, website, seo, email, social
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Histórico de Buscas
CREATE TABLE IF NOT EXISTS public.opportunity_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.opportunity_prompts(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  category_id TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_opportunity_prompts_category ON public.opportunity_prompts(category_id) WHERE is_active = true;
CREATE INDEX idx_opportunity_prompts_active ON public.opportunity_prompts(is_active) WHERE is_active = true;
CREATE INDEX idx_opportunity_searches_user ON public.opportunity_searches(user_id);
CREATE INDEX idx_opportunity_searches_created ON public.opportunity_searches(created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Categorias: público (leitura)
ALTER TABLE public.opportunity_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunity_categories_public_read" ON public.opportunity_categories FOR SELECT USING (true);

-- Prompts: público (leitura apenas ativos)
ALTER TABLE public.opportunity_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunity_prompts_public_read" ON public.opportunity_prompts FOR SELECT USING (is_active = true);

-- Histórico: isolado por usuário
ALTER TABLE public.opportunity_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunity_searches_user_crud" ON public.opportunity_searches 
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Atualizar updated_at em prompts
CREATE OR REPLACE FUNCTION public.update_opportunity_prompt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_opportunity_prompt_updated_at
BEFORE UPDATE ON public.opportunity_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_opportunity_prompt_updated_at();

-- Incrementar usage_count ao criar search
CREATE OR REPLACE FUNCTION public.increment_opportunity_prompt_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.opportunity_prompts
  SET usage_count = usage_count + 1
  WHERE id = NEW.prompt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_opportunity_prompt_usage
AFTER INSERT ON public.opportunity_searches
FOR EACH ROW EXECUTE FUNCTION public.increment_opportunity_prompt_usage();

-- =====================================================
-- SEED: Categorias
-- =====================================================

INSERT INTO public.opportunity_categories (id, name, description, icon) VALUES
  ('web-digital', 'Web & Digital', 'Credibilidade e Fundamentos Técnicos', '🌐'),
  ('seo-visibilidade', 'SEO & Visibilidade', 'Invisibilidade e Dificuldade em Ser Achado', '🔍'),
  ('reputacao-social', 'Reputação & Social', 'Gestão de Imagem e Confiança', '⭐'),
  ('conversao-vendas', 'Conversão & Vendas', 'Tráfego que Não Vira Dinheiro', '💰'),
  ('automacao-processos', 'Automação & Processos', 'Ineficiência e Perda de Leads', '🤖')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED: Prompts (30+ prompts estratégicos)
-- =====================================================

-- Web & Digital (8 prompts)
INSERT INTO public.opportunity_prompts (category_id, prompt_text, pain_point, data_sources) VALUES
  ('web-digital', 'Ache 20 empresas sem site na zona sul de São Paulo com avaliação acima de 4 estrelas', 'Empresas sem presença digital básica', ARRAY['google_maps']),
  ('web-digital', 'Listar negócios B2B com site sem certificado HTTPS (protocolo inseguro)', 'Sites sem segurança SSL', ARRAY['website', 'seo']),
  ('web-digital', 'Encontrar 15 empresas com site lento (PageSpeed < 50) e sem versão mobile', 'Performance e responsividade ruins', ARRAY['website', 'seo']),
  ('web-digital', 'Ache empresas que usam @gmail ou @hotmail como e-mail principal em vez de domínio próprio', 'Falta de profissionalismo na comunicação', ARRAY['google_maps', 'website']),
  ('web-digital', 'Liste empresas com site feito em plataforma gratuita (Wix Free, WordPress.com) com anúncios visíveis', 'Imagem amadora por plataforma grátis', ARRAY['website', 'seo']),
  ('web-digital', 'Encontre negócios B2B cujo site não foi atualizado nos últimos 2 anos (data no rodapé ou blog)', 'Site abandonado ou desatualizado', ARRAY['website']),
  ('web-digital', 'Ache clínicas/consultórios sem sistema de agendamento online no site', 'Processos manuais que afastam clientes', ARRAY['website', 'google_maps']),
  ('web-digital', 'Liste empresas com site sem política de privacidade ou termos de uso (LGPD)', 'Não conformidade com LGPD', ARRAY['website']);

-- SEO & Visibilidade (7 prompts)
INSERT INTO public.opportunity_prompts (category_id, prompt_text, pain_point, data_sources) VALUES
  ('seo-visibilidade', 'Encontre empresas locais que não aparecem no Google para a própria marca', 'Invisibilidade digital total', ARRAY['seo', 'google_maps']),
  ('seo-visibilidade', 'Ache negócios com Google Meu Negócio não reivindicado ou desatualizado há mais de 6 meses', 'Perfil abandonado ou não gerenciado', ARRAY['google_maps']),
  ('seo-visibilidade', 'Listar empresas que não rankeiam para nenhuma palavra-chave local de alto volume', 'Zero visibilidade orgânica', ARRAY['seo']),
  ('seo-visibilidade', 'Encontre negócios sem descrição no Google Meu Negócio ou com menos de 50 caracteres', 'Perfil incompleto que não converte', ARRAY['google_maps']),
  ('seo-visibilidade', 'Ache empresas com site sem meta description ou title tags otimizadas', 'SEO on-page inexistente', ARRAY['website', 'seo']),
  ('seo-visibilidade', 'Liste negócios que não aparecem em mapas (sem coordenadas GPS no GMB)', 'Impossível de encontrar no mapa', ARRAY['google_maps']),
  ('seo-visibilidade', 'Encontre empresas B2B sem blog ou conteúdo educativo no site', 'Zero estratégia de atração', ARRAY['website', 'seo']);

-- Reputação & Social (8 prompts)
INSERT INTO public.opportunity_prompts (category_id, prompt_text, pain_point, data_sources) VALUES
  ('reputacao-social', 'Ache empresas com nota abaixo de 4 estrelas que não responderam a 70% dos comentários negativos', 'Reputação em queda livre', ARRAY['google_maps']),
  ('reputacao-social', 'Liste 50 negócios com alta nota (4.5+), mas menos de 10 avaliações nos últimos 3 meses', 'Baixa prova social recente', ARRAY['google_maps']),
  ('reputacao-social', 'Encontre restaurantes/clínicas cujas fotos de clientes mostram qualidade inferior às fotos oficiais', 'Expectativa vs realidade negativa', ARRAY['google_maps']),
  ('reputacao-social', 'Ache empresas com perfis sociais abandonados (última postagem > 6 meses)', 'Redes sociais fantasmas', ARRAY['social']),
  ('reputacao-social', 'Liste negócios sem link para redes sociais no site ou Google Meu Negócio', 'Zero presença social', ARRAY['website', 'google_maps']),
  ('reputacao-social', 'Encontre empresas que receberam reclamação no Reclame Aqui e não responderam', 'Gestão de crise inexistente', ARRAY['social']),
  ('reputacao-social', 'Ache negócios com avaliações falsas evidentes (mesmo texto, contas criadas no mesmo dia)', 'Manipulação de reputação', ARRAY['google_maps']),
  ('reputacao-social', 'Liste empresas sem depoimentos ou cases de clientes no site', 'Falta de prova social no site', ARRAY['website']);

-- Conversão & Vendas (8 prompts)
INSERT INTO public.opportunity_prompts (category_id, prompt_text, pain_point, data_sources) VALUES
  ('conversao-vendas', 'Ache empresas B2B que recebem tráfego mas não têm formulário de contato visível no site', 'Tráfego desperdiçado', ARRAY['website', 'seo']),
  ('conversao-vendas', 'Liste negócios sem botão de WhatsApp flutuante ou sistema de agendamento online', 'Atrito na conversão', ARRAY['website', 'google_maps']),
  ('conversao-vendas', 'Encontrar lojas e-commerce com bom tráfego, mas sem prova social nas páginas de produto', 'Baixa taxa de conversão', ARRAY['website', 'seo']),
  ('conversao-vendas', 'Ache empresas sem CTA (Call-to-Action) claro na homepage', 'Visitante não sabe o que fazer', ARRAY['website']),
  ('conversao-vendas', 'Liste negócios que não oferecem chat ao vivo, chatbot ou resposta rápida no WhatsApp', 'Lead esfria antes de contato', ARRAY['website']),
  ('conversao-vendas', 'Encontre empresas com checkout complexo (mais de 3 etapas) ou sem opções de pagamento modernas (PIX)', 'Abandono de carrinho alto', ARRAY['website']),
  ('conversao-vendas', 'Ache clínicas/escritórios que não exibem preços ou faixas de investimento', 'Cliente não se qualifica sozinho', ARRAY['website', 'google_maps']),
  ('conversao-vendas', 'Liste negócios sem remarketing ou pixel de conversão instalado no site', 'Perda de leads sem retargeting', ARRAY['website']);

-- Automação & Processos (9 prompts)
INSERT INTO public.opportunity_prompts (category_id, prompt_text, pain_point, data_sources) VALUES
  ('automacao-processos', 'Ache clínicas médicas que atendem manualmente no WhatsApp sem chatbot ou resposta automática', 'Sobrecarga da recepção', ARRAY['google_maps']),
  ('automacao-processos', 'Listar empresas que ainda usam planilha Excel para gerenciar clientes e follow-up', 'Gestão comercial manual', ARRAY['website']),
  ('automacao-processos', 'Encontre negócios que perdem leads por falta de follow-up automatizado (resposta após 48h)', 'Lead esfria sem nutrição', ARRAY['email']),
  ('automacao-processos', 'Ache empresas sem integração entre site/formulário e CRM/WhatsApp', 'Lead manual entre sistemas', ARRAY['website']),
  ('automacao-processos', 'Liste negócios que enviam orçamentos manualmente por email em vez de sistema automatizado', 'Demora na resposta comercial', ARRAY['email']),
  ('automacao-processos', 'Encontre empresas B2B sem funil de vendas estruturado (todos os leads tratados igual)', 'Gestão comercial ineficiente', ARRAY['website']),
  ('automacao-processos', 'Ache negócios que não segmentam base de contatos (email marketing genérico para todos)', 'Comunicação sem personalização', ARRAY['email']),
  ('automacao-processos', 'Liste empresas sem dashboard de métricas comerciais (KPIs invisíveis para o gestor)', 'Gestão às cegas', ARRAY['website']),
  ('automacao-processos', 'Encontre clínicas/consultórios que confirmam consultas manualmente por telefone', 'Tempo perdido em tarefas repetitivas', ARRAY['google_maps']);

-- =====================================================
-- FUNÇÃO AUXILIAR: Gerar Prompt Aleatório
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_random_opportunity_prompt(
  p_category_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category_id TEXT,
  category_name TEXT,
  prompt_text TEXT,
  pain_point TEXT,
  data_sources TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.category_id,
    c.name AS category_name,
    p.prompt_text,
    p.pain_point,
    p.data_sources
  FROM public.opportunity_prompts p
  JOIN public.opportunity_categories c ON c.id = p.category_id
  WHERE p.is_active = true
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEW: Histórico com Categoria
-- =====================================================

CREATE OR REPLACE VIEW public.opportunity_searches_with_category AS
SELECT 
  s.id,
  s.user_id,
  s.prompt_id,
  s.prompt_text,
  s.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  s.results_count,
  s.created_at
FROM public.opportunity_searches s
JOIN public.opportunity_categories c ON c.id = s.category_id
ORDER BY s.created_at DESC;

-- RLS na view
ALTER VIEW public.opportunity_searches_with_category SET (security_invoker = true);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.opportunity_categories TO authenticated;
GRANT SELECT ON public.opportunity_prompts TO authenticated;
GRANT ALL ON public.opportunity_searches TO authenticated;
GRANT SELECT ON public.opportunity_searches_with_category TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_random_opportunity_prompt TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

COMMENT ON TABLE public.opportunity_categories IS 'Categorias de prompts de prospecção B2B';
COMMENT ON TABLE public.opportunity_prompts IS 'Prompts estratégicos para análise de mercado';
COMMENT ON TABLE public.opportunity_searches IS 'Histórico de prompts gerados por usuário';
COMMENT ON FUNCTION public.generate_random_opportunity_prompt IS 'Gera prompt aleatório (filtro opcional por categoria)';
