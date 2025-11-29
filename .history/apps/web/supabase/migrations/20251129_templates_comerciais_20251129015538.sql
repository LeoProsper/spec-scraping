-- ============================================
-- MIGRATION: Templates Comerciais com Foco em Vendas
-- ============================================
-- Data: 2025-11-29
-- Objetivo: Transformar templates em máquina de vendas

-- ============================================
-- 1. ADICIONAR COLUNAS DE POTENCIAL COMERCIAL
-- ============================================

ALTER TABLE public.list_templates 
ADD COLUMN IF NOT EXISTS ticket_type TEXT CHECK (ticket_type IN ('baixo', 'medio', 'alto')),
ADD COLUMN IF NOT EXISTS potencial_medio_cliente DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS problema TEXT NULL,
ADD COLUMN IF NOT EXISTS servico_vendavel TEXT NULL,
ADD COLUMN IF NOT EXISTS cliente_ideal TEXT NULL;

COMMENT ON COLUMN public.list_templates.ticket_type IS 
'Tipo de ticket do template: baixo (R$500-2k), medio (R$2k-10k), alto (R$10k+)';

COMMENT ON COLUMN public.list_templates.potencial_medio_cliente IS 
'Valor médio estimado de receita por cliente desta lista';

COMMENT ON COLUMN public.list_templates.problema IS 
'Problema que este segmento enfrenta';

COMMENT ON COLUMN public.list_templates.servico_vendavel IS 
'Serviço/produto que pode ser vendido para resolver o problema';

COMMENT ON COLUMN public.list_templates.cliente_ideal IS 
'Perfil do cliente ideal para este template';

-- ============================================
-- 2. LIMPAR TEMPLATES ANTIGOS (se existirem)
-- ============================================

TRUNCATE public.list_templates CASCADE;

-- ============================================
-- 3. INSERIR TEMPLATES COM FOCO COMERCIAL
-- ============================================

-- Template 1: Clínicas com má reputação
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Clínicas com Avaliação Baixa',
  'Clínicas médicas e odontológicas com avaliação abaixo de 3.5 — ideal para vender gestão de reputação online + marketing local',
  'Saúde & Reputação',
  'medio',
  4500.00,
  'Reputação online prejudicada afastando novos pacientes',
  'Gestão de reputação + Marketing médico + Google Ads local',
  'Clínicas com faturamento acima de R$50k/mês que precisam recuperar imagem',
  '{"rating_max": 3.5, "category": "clinica"}'::jsonb
);

-- Template 2: Restaurantes sem presença digital
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Restaurantes Sem Site',
  'Restaurantes sem website próprio — oportunidade para vender cardápio digital, delivery próprio e presença online',
  'Gastronomia & Digital',
  'baixo',
  1800.00,
  'Dependência total de iFood/Rappi com altas comissões',
  'Site com cardápio digital + Sistema de pedidos + Marketing de conteúdo',
  'Restaurantes locais com movimento, mas sem canal de vendas próprio',
  '{"website": false, "category": "restaurante"}'::jsonb
);

-- Template 3: Academias sem marketing digital
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Academias com Baixo Engajamento',
  'Academias com poucas avaliações e sem presença digital forte — ideal para campanhas de captação de alunos',
  'Fitness & Captação',
  'medio',
  6500.00,
  'Baixa captação de alunos novos e alta rotatividade',
  'Tráfego pago + Funil de vendas + CRM para gestão de leads',
  'Academias médias (100-500 alunos) que querem crescer',
  '{"reviews_count_max": 50, "category": "academia"}'::jsonb
);

-- Template 4: Salões de beleza sem agendamento online
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Salões Sem Sistema de Agendamento',
  'Salões de beleza que ainda trabalham apenas com telefone — venda sistema de agendamento online e automação',
  'Beleza & Automação',
  'baixo',
  1200.00,
  'Perda de clientes por não atender ligações e falta de organização',
  'Sistema de agendamento online + WhatsApp Business API + Lembretes automáticos',
  'Salões estabelecidos com 3+ profissionais que querem otimizar agenda',
  '{"category": "salao", "website": false}'::jsonb
);

-- Template 5: Consultórios médicos de alto padrão
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Consultórios Premium Sem Branding',
  'Consultórios médicos com alta avaliação mas sem identidade digital forte — branding médico premium',
  'Saúde Premium',
  'alto',
  15000.00,
  'Falta de diferenciação no mercado médico competitivo',
  'Branding completo + Site institucional + Marketing de autoridade + Consultoria',
  'Médicos especialistas com ticket alto (R$500+/consulta) que querem se posicionar',
  '{"rating_min": 4.5, "category": "medico", "reviews_count_min": 100}'::jsonb
);

-- Template 6: Escritórios de advocacia sem presença digital
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Escritórios de Advocacia Offline',
  'Advogados sem website profissional — marketing jurídico digital + captação de clientes online',
  'Jurídico & Captação',
  'alto',
  12000.00,
  'Dependência de indicações e falta de fluxo constante de clientes',
  'Site institucional + Blog jurídico + SEO + Tráfego pago + CRM jurídico',
  'Escritórios consolidados que querem escalar captação de clientes',
  '{"category": "advocacia", "website": false}'::jsonb
);

-- Template 7: Lojas físicas sem e-commerce
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Varejo Físico Sem Loja Online',
  'Lojas com presença física consolidada mas sem canal de vendas online — transformação digital do varejo',
  'Varejo & E-commerce',
  'medio',
  8500.00,
  'Perda de vendas para concorrentes online e limitação geográfica',
  'E-commerce completo + Integração com estoque + Marketing digital',
  'Lojas estabelecidas (5+ anos) com ticket médio acima de R$200',
  '{"category": "loja", "website": false}'::jsonb
);

-- Template 8: Corretores de imóveis sem CRM
INSERT INTO public.list_templates (
  nome, 
  descricao, 
  categoria, 
  ticket_type, 
  potencial_medio_cliente,
  problema,
  servico_vendavel,
  cliente_ideal,
  filtros
) VALUES (
  'Imobiliárias Sem Gestão de Leads',
  'Corretores e imobiliárias perdendo negócios por falta de follow-up — CRM imobiliário + automação',
  'Imóveis & CRM',
  'medio',
  5500.00,
  'Leads não convertidos por falta de organização e follow-up',
  'CRM imobiliário + Funil de vendas + WhatsApp integrado + Automação de follow-up',
  'Corretores com 10+ imóveis/mês que querem aumentar conversão',
  '{"category": "imoveis"}'::jsonb
);

-- ============================================
-- 4. ÍNDICES PARA OTIMIZAÇÃO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_list_templates_ticket_type 
  ON public.list_templates(ticket_type) 
  WHERE ativo = TRUE;

CREATE INDEX IF NOT EXISTS idx_list_templates_categoria 
  ON public.list_templates(categoria) 
  WHERE ativo = TRUE;

-- ============================================
-- 5. ATUALIZAR COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.list_templates IS 
'Templates de listas com foco comercial.
Cada template representa uma oportunidade de venda específica com:
- Problema identificado
- Solução vendável
- Perfil de cliente ideal
- Ticket estimado

Uso: Transformar dados em pipeline de vendas';
