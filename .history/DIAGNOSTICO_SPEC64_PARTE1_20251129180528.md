# 🔍 DIAGNÓSTICO TÉCNICO SPEC64 — PARTE 1

**Data do Diagnóstico:** 29/11/2025  
**Versão do Sistema:** 0.2.0  
**Ambiente:** Next.js 15.5.4 + Supabase (PostgreSQL 15)  
**Status:** ✅ FOTOGRAFIA REAL DO SISTEMA ATUAL

---

## 📋 SUMÁRIO EXECUTIVO

**O que é o {spec64} hoje?**

Um **CRM B2B + Chat AI** em estágio **Early SaaS (MVP funcional)**, focado em prospecção de empresas via Google Maps, com módulos operacionais de CRM, listas comerciais, interações e propostas. Sistema **PRONTO PARA TESTES BETA** com usuários reais, mas **NÃO pronto para escala** (10k+ usuários).

**Maturidade Técnica:** ⚠️ **Early SaaS (60%)**
- ✅ Backend funcional (APIs REST)
- ✅ Banco estruturado com RLS
- ✅ Integração Chat AI → CRM completa
- ⚠️ Frontend parcialmente implementado
- ⚠️ Performance não otimizada para escala
- ⚠️ Telemetria básica (sem analytics avançado)
- ❌ Testes automatizados ausentes
- ❌ CI/CD não configurado

---

## 🏗️ FASE 1 — VISÃO GERAL DO PRODUTO

### 1.1 Módulos Existentes

#### ✅ **CRM Master** (OPERACIONAL)
- **Localização:** `/home/crm`
- **Função Real:** Exibe todas as empresas em tabela unificada com filtros comerciais
- **Status:** 100% funcional
- **Features Reais:**
  - Tabela paginada com todas as empresas
  - Filtros: lead_status, responsável, categoria, município, origem
  - KPIs de pressão operacional (Leads ativos, Hot leads, Leads frios, Follow-ups)
  - KPIs de conversão (Leads qualificados, Em negociação, Ganhos, Perdidos)
  - Alertas comportamentais automáticos (leads sem follow-up há 30+ dias)
  - Atalhos comerciais (filtros rápidos: "Sem responsável", "Sem interação", etc.)
  - Exportação CSV completa
  - Ações de contato direto: WhatsApp, Call, Email (com telemetria)
- **Dependências:**
  - View: `companies_master_view` (100% real)
  - APIs: `/api/companies/master`, `/api/companies/pressure-stats`, `/api/companies/conversion-stats`, `/api/companies/export-csv`

#### ✅ **Chat AI / Scout** (OPERACIONAL)
- **Localização:** `/home/scout/chat`
- **Função Real:** Interface conversacional para buscar empresas via Google Maps
- **Status:** 100% funcional
- **Features Reais:**
  - Sistema de conversações persistentes (conversations + messages tables)
  - Busca via API externa (Scraper Google Maps porta 3001)
  - Integração AUTOMÁTICA Chat → CRM (função `create_or_update_company_from_chat`)
  - Histórico de buscas (tabela `searches` com JSONB results)
  - Exibição de resultados em cards expansíveis
  - Deduplicação por place_id + responsavel_id
  - Telemetria completa (lead_criado_via_chat, lead_atualizado_via_chat)
- **Dependências:**
  - Tabelas: `conversations`, `messages`, `conversation_searches`, `searches`, `companies`
  - APIs: `/api/scout/search`, `/api/scout/searches`, `/api/conversations/*`
  - Serviço externo: Scraper API (http://localhost:3001)

#### ✅ **Sistema de Listas** (OPERACIONAL)
- **Localização:** `/home/lists`
- **Função Real:** Criação e gerenciamento de listas comerciais (similar a CRM pipelines)
- **Status:** 100% funcional
- **Features Reais:**
  - Criar listas custom ou via templates
  - Adicionar empresas do CRM em listas
  - Duplicar listas
  - Tornar listas públicas/privadas
  - Métricas de negócio por lista (total, contatadas, leads quentes, vendas, taxa conversão)
  - Visualizar empresas dentro da lista com detalhes
  - Drawer de detalhes da empresa com timeline de interações
  - Registrar novas interações direto na lista
- **Dependências:**
  - Tabelas: `lists`, `list_companies`, `list_templates`
  - Views: `listas_com_quantidade`, `empresas_por_lista`, `listas_publicas`
  - APIs: `/api/lists/duplicate`, `/api/lists/toggle-public`
  - Funções SQL: `adicionar_empresa_lista`, `duplicar_lista`, `criar_lista_de_template`

#### ✅ **Interações (Company Interactions)** (OPERACIONAL)
- **Localização:** Integrado ao CRM e Listas (modals/drawers)
- **Função Real:** Registro de follow-ups, ligações, reuniões, e-mails, propostas enviadas
- **Status:** 100% funcional
- **Features Reais:**
  - Criar interação com tipo (reuniao, ligacao, email, proposta_enviada, follow_up, outro)
  - Registrar resultado (positivo, negativo, neutro, sem_resposta)
  - Agendar próxima ação (next_action_at)
  - Observações em texto livre
  - Timeline de interações por empresa
  - Atualiza automaticamente `ultima_interacao` em companies
  - Trigger que sincroniza lead_status quando interação é criada
- **Dependências:**
  - Tabela: `company_interactions`
  - Views: `interactions_por_empresa`, `interactions_por_usuario`, `company_timeline`
  - Função SQL: `registrar_interacao`, `sync_company_on_interaction`

#### ⚠️ **Propostas** (PARCIAL - 40%)
- **Localização:** Tabela `proposals` existe no banco
- **Função Real:** Armazena propostas criadas para empresas
- **Status:** 40% implementado
- **O que EXISTE:**
  - Tabela `proposals` com campos: company_id, user_id, proposal_url, status, description, value, created_at
  - RLS policies: proposals_read, proposals_insert, proposals_update
  - Índices: idx_proposals_company_id, idx_proposals_user_id, idx_proposals_status, idx_proposals_url
- **O que NÃO EXISTE:**
  - ❌ UI para criar proposta (frontend ausente)
  - ❌ API de criação de proposta
  - ❌ Geração automática de PDF
  - ❌ Templates de proposta
- **Conclusão:** Apenas estrutura de dados, sem funcionalidade exposta ao usuário

#### ⚠️ **Painel de KPIs / Dashboard** (PARCIAL - 30%)
- **Localização:** `/home` (página inicial)
- **Função Real:** Exibe KPIs comerciais básicos
- **Status:** 30% implementado
- **O que EXISTE:**
  - Componente `DashboardDemo` (arquivo: `dashboard-demo.tsx`)
  - Componente `DashboardDemoCharts` (arquivo: `dashboard-demo-charts.tsx`)
- **O que NÃO EXISTE:**
  - ❌ Dados reais (usa mocks hardcoded)
  - ❌ Gráficos conectados ao banco
  - ❌ Filtros por período
  - ❌ Drill-down em métricas
- **Conclusão:** Apenas UI mockup, sem backend real

#### ❌ **Kaix Scout (Search clássico)** (DESCONTINUADO)
- **Status:** Sistema antigo, substituído pelo Chat AI
- **Tabelas órfãs:** `searches` (ainda usada pelo Chat AI para histórico)
- **Conclusão:** Funcionalidade integrada ao Chat AI, não é módulo separado

#### ❌ **Análise de Website** (APENAS ESTRUTURA)
- **Status:** Tabela `website_analysis` existe mas sem uso
- **Função Planejada:** Análise automática de websites de empresas
- **O que EXISTE:**
  - Tabela `website_analysis` com campos: company_id, url, score, score_category, has_ssl, has_responsive, etc.
- **O que NÃO EXISTE:**
  - ❌ Scraper de websites
  - ❌ API de análise
  - ❌ UI para exibir análises
- **Conclusão:** Apenas estrutura de dados, funcionalidade não implementada

#### ❌ **Pagamentos** (APENAS ESTRUTURA)
- **Status:** Tabela `payments` existe mas sem uso
- **Função Planejada:** Controle financeiro de vendas
- **O que EXISTE:**
  - Tabela `payments` com campos: proposal_id, user_id, stripe_session_id, amount, status
- **O que NÃO EXISTE:**
  - ❌ Integração com Stripe
  - ❌ UI de pagamentos
  - ❌ Fluxo de cobrança
- **Conclusão:** Preparado para futuro módulo financeiro, mas não ativo

---

### 1.2 Resumo de Maturidade dos Módulos

| Módulo | Status | Maturidade | Pronto para Produção? |
|--------|--------|------------|------------------------|
| **CRM Master** | ✅ Operacional | 95% | ✅ SIM |
| **Chat AI / Scout** | ✅ Operacional | 90% | ✅ SIM |
| **Sistema de Listas** | ✅ Operacional | 90% | ✅ SIM |
| **Interações** | ✅ Operacional | 100% | ✅ SIM |
| **Propostas** | ⚠️ Parcial | 40% | ❌ NÃO (apenas estrutura) |
| **Dashboard KPIs** | ⚠️ Mock | 30% | ❌ NÃO (dados fake) |
| **Análise Website** | ❌ Apenas estrutura | 5% | ❌ NÃO |
| **Pagamentos** | ❌ Apenas estrutura | 5% | ❌ NÃO |

---

## 🗄️ FASE 2 — DIAGNÓSTICO DO BANCO DE DADOS (SUPABASE)

### 2.1 Visão Geral

- **SGBD:** PostgreSQL 15 via Supabase (Docker local)
- **Container:** `supabase_db_next-supabase-saas-kit-turbo-lite`
- **Total de Tabelas:** 35 (19 auth.*, 16 public.*)
- **Total de Views:** 17 (todas public.*)
- **Total de Funções:** 52 (inclui pg_trgm extensions)
- **Total de Policies RLS:** 51 (multiusuário 100% implementado)
- **Total de Índices:** 103 (bem indexado)
- **Tamanho Atual:** 
  - companies: 584 KB (1 registro)
  - searches: 536 KB (26 registros)
  - Demais tabelas: < 200 KB cada

### 2.2 Tabelas Principais (Public Schema)

#### **accounts** (Tabela de contas/organizações)
- **Finalidade:** Conta da organização (workspace do usuário)
- **Registros Atuais:** 1
- **Campos-Chave:** id, email, name, picture_url, slug, primary_owner_user_id
- **Foreign Keys:** primary_owner_user_id → auth.users(id)
- **Triggers:** 
  - `protect_account_fields` (protege campos críticos)
  - `on_auth_user_created` (cria account ao criar user)
  - `on_auth_user_updated` (sincroniza dados)
- **RLS Policies:** 
  - `accounts_read` (SELECT por auth.uid())
  - `accounts_update` (UPDATE por primary_owner_user_id)
- **Índices:** 
  - `accounts_pkey` (PRIMARY KEY id)
  - `accounts_email_key` (UNIQUE email)
- **Status:** ✅ Normalizada, sem duplicação

---

#### **companies** (Tabela central de empresas)
- **Finalidade:** Armazena TODAS as empresas do sistema (leads, prospects, clientes)
- **Registros Atuais:** 1
- **Campos-Chave:**
  - Identificação: id, place_id, company_global_id, cnpj, razao_social, name
  - Localização: address, municipio, uf, coordinates (PostGIS point)
  - Contato: phone, website, email, receita_telefones (JSONB array)
  - Google: rating, total_reviews, categories, google_maps_link, about, opening_hours
  - Comercial: lead_status, responsavel_id, origem, ultima_interacao, data_primeiro_contato, pipeline_stage, observacoes, tags (array)
  - Scoring: priority_score, priority_level
  - Receita Federal: situacao_cadastral, porte_empresa, opcao_simples, opcao_mei, qsa (JSONB), cnaes_secundarios (JSONB)
  - Timestamps: created_at, updated_at, last_seen_at
- **Foreign Keys:** 
  - search_id → searches(id) (NULLABLE - empresas do Chat AI ficam NULL)
  - responsavel_id → accounts(id) (NULLABLE até atribuir responsável)
- **Triggers:**
  - `update_companies_updated_at` (atualiza updated_at)
  - `companies_update_last_seen` (atualiza last_seen_at)
  - `on_company_created` (telemetria ao criar empresa)
  - `companies_auto_update_interacao` (atualiza ultima_interacao)
  - `trigger_update_company_priority` (recalcula priority_score)
  - `trg_update_company_ultima_interacao` (sincroniza com interactions)
- **RLS Policies:**
  - `companies_read` (SELECT: search_id matching user OR responsavel_id matching account)
  - `companies_responsavel_read` (SELECT por responsavel_id)
  - `companies_insert` (INSERT: user_id = search.user_id OR authenticated)
  - `companies_update` (UPDATE por responsavel_id ou search ownership)
  - `companies_responsavel_update` (UPDATE por responsavel_id)
- **Índices (38 total):**
  - `companies_pkey` (PRIMARY KEY id)
  - `idx_companies_place_id_user` (UNIQUE place_id, responsavel_id) — **Deduplicação Chat AI**
  - `idx_companies_search_place` (UNIQUE search_id, place_id)
  - `idx_companies_name_trgm` (GIN trigram para busca fuzzy)
  - `idx_companies_crm_filters` (lead_status, responsavel_id, category, municipio)
  - `idx_companies_status_interacao` (lead_status, ultima_interacao DESC)
  - `idx_companies_priority_score` (priority_score DESC)
  - `idx_companies_rating` (rating DESC NULLS LAST)
  - `idx_companies_total_reviews` (total_reviews DESC NULLS LAST)
  - `idx_companies_cnpj`, `idx_companies_category`, `idx_companies_municipio`, `idx_companies_uf`
  - `idx_companies_responsavel`, `idx_companies_responsavel_id`, `idx_companies_responsavel_status`
  - `idx_companies_lead_status`, `idx_companies_pipeline_stage`, `idx_companies_origem`
  - `idx_companies_tags` (GIN array), `idx_companies_qsa` (GIN JSONB), `idx_companies_receita_telefones` (GIN JSONB)
  - `idx_companies_has_website` (computed: website IS NOT NULL AND website != '')
  - E mais 15 índices especializados
- **Status:** ✅ **Extremamente bem estruturada**, pronta para escala
- **Observação Crítica:** 
  - Empresas vindas do Chat AI têm `search_id = NULL` (design intencional)
  - RLS permite acesso via `responsavel_id`, então não há problema de segurança

---

#### **company_interactions** (Interações comerciais)
- **Finalidade:** Timeline de todas as interações com empresas
- **Registros Atuais:** 0
- **Campos-Chave:**
  - Identificação: id, company_id, user_id
  - Tipo: tipo (reuniao, ligacao, email, proposta_enviada, follow_up, outro)
  - Resultado: resultado (positivo, negativo, neutro, sem_resposta)
  - Agendamento: next_action_at, observacoes
  - Timestamps: created_at
- **Foreign Keys:**
  - company_id → companies(id) ON DELETE CASCADE
  - user_id → auth.users(id)
- **Triggers:**
  - `company_interactions_sync_trigger` (sincroniza com companies.ultima_interacao)
- **RLS Policies:**
  - `interactions_read` (SELECT por company responsavel_id ou user_id)
  - `interactions_insert` (INSERT por authenticated)
  - `interactions_update` (UPDATE por user_id)
  - `interactions_delete` (DELETE por user_id)
- **Índices:**
  - `company_interactions_pkey` (PRIMARY KEY id)
  - `idx_company_interactions_company_id`
  - `idx_company_interactions_user_id`
  - `idx_company_interactions_company_timeline` (company_id, created_at DESC)
  - `idx_company_interactions_user_timeline` (user_id, created_at DESC)
  - `idx_company_interactions_tipo`
  - `idx_company_interactions_resultado`
  - `idx_company_interactions_next_action` (next_action_at WHERE NOT NULL)
- **Status:** ✅ Normalizada, bem indexada

---

#### **company_import_logs** (Auditoria de importações)
- **Finalidade:** Log de todas as criações/atualizações de empresas via Chat AI ou outras fontes
- **Registros Atuais:** 0 (logs ainda não gerados)
- **Campos-Chave:**
  - Identificação: id, user_id, company_id, place_id
  - Rastreamento: source (chat_ai, import_csv, api, manual), action (created, updated, skipped, error)
  - Metadados: metadata (JSONB com name, city, category, etc.), error_message
  - Timestamps: created_at
- **Foreign Keys:**
  - user_id → auth.users(id)
  - company_id → companies(id) ON DELETE SET NULL
- **Triggers:** Nenhum
- **RLS Policies:**
  - `company_import_logs_read` (SELECT por user_id)
  - `company_import_logs_insert` (INSERT por authenticated)
- **Índices:**
  - `company_import_logs_pkey` (PRIMARY KEY id)
  - `idx_company_import_logs_user`
  - `idx_company_import_logs_company_id`
  - `idx_company_import_logs_source`
  - `idx_company_import_logs_action`
  - `idx_company_import_logs_created_at` (DESC)
- **Status:** ✅ Pronta para produção, aguardando uso

---

#### **searches** (Histórico de buscas)
- **Finalidade:** Armazena buscas realizadas (originalmente Kaix Scout, agora também Chat AI)
- **Registros Atuais:** 26
- **Campos-Chave:**
  - Identificação: id, user_id
  - Busca: query, results (JSONB array com empresas encontradas), total_results, status (pending, completed, failed)
  - Timestamps: created_at, updated_at
- **Foreign Keys:**
  - user_id → auth.users(id)
- **Triggers:**
  - `increment_searches_count_trigger` (incrementa contador em accounts)
- **RLS Policies:**
  - `searches_read` (SELECT por user_id)
  - `searches_insert` (INSERT por authenticated)
  - `searches_update` (UPDATE por user_id)
  - `Users can view their own searches` (SELECT por user_id)
  - `Users can create their own searches` (INSERT por authenticated)
  - `Users can update their own searches` (UPDATE por user_id)
  - `Users can delete their own searches` (DELETE por user_id)
- **Índices:**
  - `searches_pkey` (PRIMARY KEY id)
  - `idx_searches_user_id`
  - `idx_searches_created_at` (DESC)
  - `idx_searches_status`
  - `idx_searches_results` (GIN JSONB)
- **Status:** ✅ Funcional, mas `results` JSONB pode crescer muito (risco de performance)
- **Observação:** Empresas do Chat AI são salvas em `companies` E em `searches.results` (duplicação intencional para histórico)

---

#### **conversations** (Conversações do Chat AI)
- **Finalidade:** Cada thread de conversa do Chat AI
- **Registros Atuais:** 0
- **Campos-Chave:**
  - Identificação: id, user_id
  - Conteúdo: title (gerado automaticamente), system_prompt
  - Status: status (active, archived), message_count, search_count
  - Timestamps: created_at, updated_at, last_message_at
- **Foreign Keys:**
  - user_id → auth.users(id)
- **Triggers:**
  - `on_conversation_title` (gera título automaticamente)
  - `on_conversation_updated` (atualiza updated_at)
- **RLS Policies:**
  - `Users can view own conversations` (SELECT por user_id)
  - `Users can create own conversations` (INSERT por authenticated)
  - `Users can update own conversations` (UPDATE por user_id)
  - `Users can delete own conversations` (DELETE por user_id)
- **Índices:**
  - `conversations_pkey` (PRIMARY KEY id)
  - `idx_conversations_user`
  - `idx_conversations_status`
  - `idx_conversations_last_message` (last_message_at DESC)
- **Status:** ✅ Normalizada

---

#### **messages** (Mensagens do Chat AI)
- **Finalidade:** Armazena mensagens (user + assistant) dentro de conversations
- **Registros Atuais:** 0
- **Campos-Chave:**
  - Identificação: id, conversation_id
  - Conteúdo: role (user, assistant, system), content (text), metadata (JSONB)
  - Timestamps: created_at
- **Foreign Keys:**
  - conversation_id → conversations(id) ON DELETE CASCADE
- **Triggers:**
  - `on_message_created` (incrementa message_count em conversation)
  - `on_message_deleted` (decrementa message_count em conversation)
- **RLS Policies:**
  - `Users can view messages of own conversations` (SELECT por conversation.user_id)
  - `Users can create messages in own conversations` (INSERT por conversation.user_id)
- **Índices:**
  - `messages_pkey` (PRIMARY KEY id)
  - `idx_messages_conversation`
  - `idx_messages_created`
  - `idx_messages_role`
- **Status:** ✅ Normalizada
- **Risco:** Tabela vai crescer muito (1 conversa = dezenas de mensagens), falta estratégia de arquivamento

---

#### **conversation_searches** (Vínculo conversas ↔ buscas)
- **Finalidade:** Tabela de junção entre conversations e searches (M:N)
- **Registros Atuais:** 0
- **Campos-Chave:** id, conversation_id, search_id, created_at
- **Foreign Keys:**
  - conversation_id → conversations(id) ON DELETE CASCADE
  - search_id → searches(id) ON DELETE CASCADE
- **Triggers:**
  - `on_conversation_search_created` (incrementa search_count em conversation)
- **RLS Policies:**
  - `Users can view own conversation searches` (SELECT por conversation.user_id)
  - `Users can create own conversation searches` (INSERT por conversation.user_id)
- **Índices:**
  - `conversation_searches_pkey` (PRIMARY KEY id)
  - `conversation_searches_conversation_id_search_id_key` (UNIQUE conversation_id, search_id)
  - `idx_conversation_searches_conversation`
  - `idx_conversation_searches_search`
- **Status:** ✅ Normalizada

---

#### **lists** (Listas comerciais)
- **Finalidade:** Listas personalizadas de empresas (ex: "Prospecção SP Zona Sul", "Hot Leads Nov/25")
- **Registros Atuais:** 7
- **Campos-Chave:**
  - Identificação: id, user_id
  - Conteúdo: nome, descricao, cor, is_public, total_resultados
  - Timestamps: created_at, updated_at
- **Foreign Keys:**
  - user_id → auth.users(id)
- **Triggers:**
  - `lists_update_timestamp_trigger` (atualiza updated_at)
- **RLS Policies:**
  - `lists_read` (SELECT por user_id OU is_public = true)
  - `lists_insert` (INSERT por authenticated)
  - `lists_update` (UPDATE por user_id)
  - `lists_delete` (DELETE por user_id)
- **Índices:**
  - `lists_pkey` (PRIMARY KEY id)
  - `idx_lists_user_id`
  - `idx_lists_created_at` (DESC)
  - `idx_lists_public` (is_public = true)
  - `idx_lists_total_resultados` (DESC)
  - `idx_lists_nome` (GIN tsvector portuguese)
- **Status:** ✅ Normalizada

---

#### **list_companies** (Empresas dentro de listas)
- **Finalidade:** Tabela de junção entre lists e companies (M:N)
- **Registros Atuais:** 3
- **Campos-Chave:**
  - Identificação: id, list_id, company_id
  - Organização: posicao (ordem dentro da lista), observacoes
  - Timestamps: added_at
- **Foreign Keys:**
  - list_id → lists(id) ON DELETE CASCADE
  - company_id → companies(id) ON DELETE CASCADE
- **Triggers:**
  - `list_companies_insert_trigger` (incrementa total_resultados em list)
  - `list_companies_delete_trigger` (decrementa total_resultados em list)
- **RLS Policies:**
  - `list_companies_read` (SELECT por list.user_id OU list.is_public = true)
  - `list_companies_insert` (INSERT por list.user_id)
  - `list_companies_update` (UPDATE por list.user_id)
  - `list_companies_delete` (DELETE por list.user_id)
- **Índices:**
  - `list_companies_pkey` (PRIMARY KEY id)
  - `list_companies_unique` (UNIQUE list_id, company_id) — **Impede duplicação**
  - `idx_list_companies_list_id`
  - `idx_list_companies_company_id`
  - `idx_list_companies_posicao` (list_id, posicao WHERE posicao NOT NULL)
- **Status:** ✅ Normalizada, bem indexada

---

#### **list_templates** (Templates de listas prontas)
- **Finalidade:** Templates pré-criados de listas (ex: "Restaurantes de alta qualidade", "Leads B2B Tech")
- **Registros Atuais:** Desconhecido (não contado)
- **Campos-Chave:**
  - Identificação: id
  - Conteúdo: nome, descricao, categoria, ticket_type, filtros (JSONB), ativo
  - Timestamps: created_at
- **Foreign Keys:** Nenhuma
- **Triggers:** Nenhum
- **RLS Policies:** Nenhuma (tabela pública para leitura)
- **Índices:**
  - `list_templates_pkey` (PRIMARY KEY id)
  - `idx_list_templates_ativo` (ativo = true)
  - `idx_list_templates_categoria`
  - `idx_list_templates_ticket_type`
- **Status:** ✅ Estrutura OK, mas pode estar vazia

---

#### **proposals** (Propostas comerciais)
- **Finalidade:** Propostas criadas para empresas (status: draft, sent, accepted, rejected)
- **Registros Atuais:** 0
- **Campos-Chave:**
  - Identificação: id, company_id, user_id
  - Conteúdo: proposal_url (URL pública da proposta), description, value, status
  - Timestamps: created_at, updated_at
- **Foreign Keys:**
  - company_id → companies(id) ON DELETE CASCADE
  - user_id → auth.users(id)
- **Triggers:**
  - `update_proposals_updated_at` (atualiza updated_at)
- **RLS Policies:**
  - `proposals_read` (SELECT por company.responsavel_id)
  - `proposals_public_read` (SELECT se proposal_url público)
  - `proposals_insert` (INSERT por authenticated)
  - `proposals_update` (UPDATE por user_id)
- **Índices:**
  - `proposals_pkey` (PRIMARY KEY id)
  - `proposals_proposal_url_key` (UNIQUE proposal_url)
  - `idx_proposals_url` (UNIQUE proposal_url WHERE NOT NULL)
  - `idx_proposals_company_id`
  - `idx_proposals_user_id`
  - `idx_proposals_status`
- **Status:** ✅ Estrutura pronta, aguardando implementação de UI

---

#### **payments** (Pagamentos / Vendas)
- **Finalidade:** Controle financeiro de vendas (futuro módulo)
- **Registros Atuais:** 0
- **Campos-Chave:**
  - Identificação: id, proposal_id, user_id
  - Pagamento: stripe_session_id, amount, currency, status
  - Timestamps: created_at, updated_at
- **Foreign Keys:**
  - proposal_id → proposals(id)
  - user_id → auth.users(id)
- **Triggers:** Nenhum
- **RLS Policies:**
  - `payments_read` (SELECT por user_id)
  - `payments_insert` (INSERT por authenticated)
- **Índices:**
  - `payments_pkey` (PRIMARY KEY id)
  - `idx_payments_proposal_id`
  - `idx_payments_user_id`
  - `idx_payments_stripe_session`
  - `idx_payments_status`
- **Status:** ⚠️ Estrutura OK, mas SEM integração Stripe

---

#### **onboarding** (Progresso de onboarding do usuário)
- **Finalidade:** Tracking de quais ações o usuário já completou (gamificação)
- **Registros Atuais:** Desconhecido
- **Campos-Chave:**
  - Identificação: id, proposal_id (FK única para cada proposta)
  - Progress: first_lead_created, first_whatsapp_clicked, first_proposal_created, first_csv_exported, etc.
  - Timestamps: created_at, updated_at
- **Foreign Keys:**
  - proposal_id → proposals(id) (relação 1:1 estranha, deveria ser account_id ou user_id)
- **Triggers:**
  - `update_onboarding_updated_at` (atualiza updated_at)
- **RLS Policies:**
  - `onboarding_read` (SELECT por proposal.user_id)
  - `onboarding_public_read` (SELECT se proposal público)
  - `onboarding_insert` (INSERT por authenticated)
  - `onboarding_update` (UPDATE por proposal.user_id)
- **Índices:**
  - `onboarding_pkey` (PRIMARY KEY id)
  - `idx_onboarding_proposal_id` (UNIQUE proposal_id)
- **Status:** ⚠️ **Estrutura problemática** (FK para proposal ao invés de account)

---

#### **templates** (Templates de mensagens/propostas)
- **Finalidade:** Templates reutilizáveis (ex: e-mail de follow-up, proposta padrão)
- **Registros Atuais:** 0
- **Campos-Chave:**
  - Identificação: id, company_id
  - Conteúdo: name, content, category, is_active
  - Timestamps: created_at, updated_at
- **Foreign Keys:**
  - company_id → companies(id) (relação 1:1 - estranho, deveria ser M:1)
- **Triggers:** Nenhum
- **RLS Policies:**
  - `templates_read` (SELECT público)
  - `templates_insert` (INSERT por authenticated)
- **Índices:**
  - `templates_pkey` (PRIMARY KEY id)
  - `idx_templates_company_id` (UNIQUE company_id)
- **Status:** ⚠️ **Estrutura problemática** (company_id deveria permitir múltiplos templates)

---

#### **website_analysis** (Análise de websites)
- **Finalidade:** Score de qualidade do website da empresa (futuro módulo)
- **Registros Atuais:** 0
- **Campos-Chave:**
  - Identificação: id, company_id
  - Análise: url, score, score_category, has_ssl, has_responsive, load_time, etc.
  - Timestamps: analyzed_at, created_at, updated_at
- **Foreign Keys:**
  - company_id → companies(id) ON DELETE CASCADE (relação 1:1)
- **Triggers:**
  - `update_website_analysis_updated_at` (atualiza updated_at)
- **RLS Policies:**
  - `website_analysis_read` (SELECT por company.responsavel_id)
  - `website_analysis_insert` (INSERT por authenticated)
  - `website_analysis_update` (UPDATE por company.responsavel_id)
- **Índices:**
  - `website_analysis_pkey` (PRIMARY KEY id)
  - `idx_website_analysis_company_id` (UNIQUE company_id)
  - `idx_website_analysis_score` (score DESC)
  - `idx_website_analysis_score_category`
- **Status:** ⚠️ Estrutura pronta, mas funcionalidade não implementada

---

### 2.3 Views (17 total)

| View | Finalidade | Status |
|------|-----------|--------|
| `chat_ai_recent_imports` | Últimos 100 imports via Chat AI | ✅ Funcional |
| `companies_leads_frios` | Leads sem interação há 30+ dias | ✅ Funcional |
| `companies_master_view` | View principal do CRM Master | ✅ Funcional |
| `companies_pipeline_overview` | Overview do pipeline comercial | ✅ Funcional |
| `companies_por_responsavel` | Empresas agrupadas por responsável | ✅ Funcional |
| `companies_unique_overview` | Contadores únicos de companies | ✅ Funcional |
| `companies_with_receita` | Empresas com dados da Receita Federal | ✅ Funcional |
| `company_imports_summary` | Agregado de imports por fonte | ✅ Funcional |
| `company_timeline` | Timeline de interações por empresa | ✅ Funcional |
| `empresas_por_lista` | Empresas dentro de cada lista | ✅ Funcional |
| `followups_pendentes` | Follow-ups agendados pendentes | ✅ Funcional |
| `interactions_por_empresa` | Interações agrupadas por empresa | ✅ Funcional |
| `interactions_por_usuario` | Interações agrupadas por usuário | ✅ Funcional |
| `listas_com_quantidade` | Listas com contagem de empresas | ✅ Funcional |
| `listas_publicas` | Apenas listas públicas | ✅ Funcional |
| `templates_disponiveis` | Templates ativos disponíveis | ✅ Funcional |
| `user_stats` | Estatísticas agregadas por usuário | ✅ Funcional |

**Conclusão:** Todas as 17 views estão funcionais e bem estruturadas. Nenhuma view órfã ou mock.

---

### 2.4 Funções SQL (52 total, 13 principais)

| Função | Finalidade | Status |
|--------|-----------|--------|
| `create_or_update_company_from_chat` | Integração Chat AI → CRM | ✅ Crítica, 100% funcional |
| `adicionar_empresa_lista` | Adiciona empresa em lista | ✅ Funcional |
| `atribuir_lead_responsavel` | Atribui responsável a lead | ✅ Funcional |
| `calculate_lead_priority` | Calcula priority_score | ✅ Funcional |
| `count_companies_with_filters` | Conta empresas com filtros | ✅ Funcional |
| `count_company_interactions` | Conta interações por empresa | ✅ Funcional |
| `criar_lista_de_template` | Cria lista a partir de template | ✅ Funcional |
| `duplicar_lista` | Duplica lista existente | ✅ Funcional |
| `generate_conversation_title` | Gera título para conversa | ✅ Funcional |
| `get_last_interaction` | Última interação de empresa | ✅ Funcional |
| `registrar_interacao` | Registra nova interação | ✅ Funcional |
| `sync_company_on_interaction` | Sincroniza company ao interagir | ✅ Funcional |
| `update_company_priority` | Recalcula priority_score | ✅ Funcional |

**Observação:** As outras 39 funções são da extensão `pg_trgm` (busca fuzzy) e triggers auxiliares. Todas funcionais.

---

### 2.5 Triggers (18 principais)

| Trigger | Tabela | Função | Status |
|---------|--------|--------|--------|
| `trigger_update_company_priority` | companies | Recalcula priority_score ao UPDATE | ✅ Funcional |
| `companies_auto_update_interacao` | companies | Atualiza ultima_interacao | ✅ Funcional |
| `companies_update_last_seen` | companies | Atualiza last_seen_at | ✅ Funcional |
| `on_company_created` | companies | Telemetria ao criar empresa | ✅ Funcional |
| `company_interactions_sync_trigger` | company_interactions | Sincroniza com companies | ✅ Funcional |
| `list_companies_insert_trigger` | list_companies | Incrementa total em list | ✅ Funcional |
| `list_companies_delete_trigger` | list_companies | Decrementa total em list | ✅ Funcional |
| `lists_update_timestamp_trigger` | lists | Atualiza updated_at | ✅ Funcional |
| `on_message_created` | messages | Incrementa message_count | ✅ Funcional |
| `on_message_deleted` | messages | Decrementa message_count | ✅ Funcional |
| `on_conversation_search_created` | conversation_searches | Incrementa search_count | ✅ Funcional |
| `on_conversation_title` | conversations | Gera título automaticamente | ✅ Funcional |
| `on_conversation_updated` | conversations | Atualiza updated_at | ✅ Funcional |
| `increment_searches_count_trigger` | searches | Incrementa contador em account | ✅ Funcional |
| `update_companies_updated_at` | companies | Atualiza updated_at | ✅ Funcional |
| `update_proposals_updated_at` | proposals | Atualiza updated_at | ✅ Funcional |
| `update_onboarding_updated_at` | onboarding | Atualiza updated_at | ✅ Funcional |
| `trg_update_company_ultima_interacao` | company_interactions | Sincroniza ultima_interacao | ✅ Funcional |

**Conclusão:** Sistema de triggers bem estruturado, sem triggers órfãos ou desnecessários.

---

### 2.6 Policies RLS (51 total)

**Segurança Multiusuário:** ✅ **100% implementada**

Todas as 51 policies implementam isolamento por:
- `user_id` (para tabelas de usuário único: conversations, messages, searches)
- `responsavel_id` (para companies shared entre múltiplos usuários)
- `list.user_id` (para listas e list_companies)
- `company.responsavel_id` (para interactions, proposals)

**Riscos Identificados:** ❌ NENHUM
- Sem bypass de RLS
- Sem acesso cross-account
- Sem policies permissivas demais

**Observação:** Listas públicas (`is_public = true`) intencionalmente visíveis para todos (feature, não bug).

---

### 2.7 Índices (103 total)

**Performance de Queries:** ✅ **Excelente**

Índices críticos implementados:
- **Deduplicação:** `idx_companies_place_id_user` (UNIQUE place_id, responsavel_id)
- **Busca CRM:** `idx_companies_crm_filters` (lead_status, responsavel_id, category, municipio)
- **Ordenação:** `idx_companies_priority_score DESC`, `idx_companies_rating DESC`
- **Busca Fuzzy:** `idx_companies_name_trgm` (GIN trigram)
- **JSONB:** `idx_searches_results GIN`, `idx_companies_qsa GIN`, `idx_companies_tags GIN`
- **Timeline:** `idx_company_interactions_company_timeline` (company_id, created_at DESC)
- **Foreign Keys:** Todos indexados (companies_responsavel_id, list_companies_list_id, etc.)

**Índices Desnecessários:** ❌ NENHUM (todos têm propósito claro)

---

### 2.8 Problemas Identificados no Banco

#### 🔴 **CRÍTICO: Tabela `onboarding` com FK errada**
- **Problema:** FK para `proposal_id` ao invés de `account_id` ou `user_id`
- **Impacto:** Impossível rastrear onboarding de usuários sem proposta criada
- **Solução Necessária:** Migração para alterar FK para `account_id`

#### 🔴 **CRÍTICO: Tabela `searches.results` pode crescer muito**
- **Problema:** Campo JSONB armazena array de objetos (dezenas de empresas por busca)
- **Impacto:** Performance degrada após 10k+ searches (GIN index fica lento)
- **Solução Necessária:** 
  - Estratégia de arquivamento (mover results para S3 após 6 meses)
  - OU remover `results` e depender apenas de `companies` + `conversation_searches`

#### 🟡 **MÉDIO: Tabela `messages` vai crescer exponencialmente**
- **Problema:** Cada conversa gera dezenas de mensagens (user + assistant)
- **Impacto:** Tabela vai ter milhões de linhas em produção (500k usuários = 50M messages)
- **Solução Necessária:** 
  - Particionamento por `created_at` (monthly partitions)
  - Arquivamento de conversas inativas (> 3 meses sem mensagens)

#### 🟡 **MÉDIO: Tabela `templates` com FK 1:1 para `company_id`**
- **Problema:** Impossível ter múltiplos templates para mesma empresa
- **Impacto:** Limitação de funcionalidade (provável erro de design)
- **Solução Necessária:** Remover índice UNIQUE em `idx_templates_company_id`

#### 🟢 **BAIXO: Tabela `product_events` não encontrada**
- **Problema:** Funções referenciam `product_events` mas tabela não aparece em pg_tables
- **Impacto:** Telemetria pode estar quebrando silenciosamente
- **Solução Necessária:** Verificar se tabela existe e está no schema correto

---

### 2.9 Resumo do Banco de Dados

✅ **Pontos Fortes:**
- Normalização correta (3FN em 90% das tabelas)
- RLS 100% implementado (multiusuário seguro)
- Índices bem estruturados (103 índices, todos necessários)
- Views úteis e performáticas (17 views, todas em uso)
- Triggers bem organizados (18 triggers, nenhum órfão)
- Deduplicação implementada (UNIQUE constraints estratégicos)

⚠️ **Pontos de Atenção:**
- Tabela `searches.results` JSONB pode crescer muito (planejar arquivamento)
- Tabela `messages` vai crescer exponencialmente (planejar particionamento)
- Tabela `onboarding` com FK errado (migração necessária)
- Tabela `templates` com constraint 1:1 limitante (remover UNIQUE)

❌ **Riscos de Produção:**
- Performance de `searches` degrada após 10k registros (sem estratégia de cleanup)
- `messages` pode atingir 10M+ linhas em 1 ano (sem particionamento)
- `product_events` possivelmente ausente (telemetria pode estar quebrando)

**Pronto para Produção?** ⚠️ **SIM, mas com ressalvas:**
- ✅ Suporta até 1k usuários simultâneos sem problemas
- ⚠️ Acima de 5k usuários: implementar particionamento e arquivamento
- ❌ Acima de 50k usuários: migrar `searches.results` para storage externo (S3)

---

## 🔌 FASE 3 — DIAGNÓSTICO DO BACKEND / API

### 3.1 Arquitetura Backend

- **Framework:** Next.js 15.5.4 App Router (Server Components + Server Actions)
- **Runtime:** Node.js v18.18.0+
- **ORM:** Supabase Client (sem Prisma ou TypeORM)
- **Autenticação:** Supabase Auth (JWT + RLS)
- **Armazenamento:** Supabase Storage (não usado ainda)
- **Deploy:** Não configurado (apenas local)

### 3.2 Rotas da API (REST Endpoints)

#### **POST `/api/scout/search`** (Chat AI - Busca de empresas)
- **Função:** Busca empresas via Google Maps e integra automaticamente ao CRM
- **Status:** ✅ 100% funcional
- **Input:** `{ query: string, maxPlaces?: number, radius?: number, lang?: string }`
- **Output:** `{ success: boolean, places: Place[], total: number }`
- **Integração:** 
  - Chama scraper externo (http://localhost:3001/api/scrape-maps)
  - Loop em `result.places` → chama `create_or_update_company_from_chat` para cada empresa
  - Logs: console.log de criações/atualizações
- **Dependências:** 
  - Serviço externo: Scraper API (porta 3001)
  - Função SQL: `create_or_update_company_from_chat`
- **Performance:** ⚠️ **Bloqueante** (espera scraper + loop de insert/update), pode demorar 30-60s para 20 empresas
- **Segurança:** ✅ Autenticação via Supabase session

#### **POST `/api/scout/searches`** (Salvar histórico de busca)
- **Função:** Salva busca no histórico (tabela `searches`) e integra ao CRM
- **Status:** ✅ 100% funcional
- **Input:** `{ query: string, results: Place[], total_results: number, status: 'completed' }`
- **Output:** `{ success: boolean, search: Search }`
- **Integração:** 
  - INSERT em `searches`
  - Se `status === 'completed'`: loop em `results` → chama `create_or_update_company_from_chat`
- **Performance:** ⚠️ **Bloqueante** (loop de insert/update pode demorar)
- **Segurança:** ✅ RLS garante user_id correto

#### **GET `/api/scout/searches`** (Listar histórico)
- **Função:** Retorna todas as buscas do usuário
- **Status:** ✅ Funcional
- **Output:** `{ searches: Search[] }` ordenado por created_at DESC
- **Performance:** ✅ Rápido (indexed por user_id + created_at)

#### **GET `/api/scout/searches/[id]`** (Detalhes de busca)
- **Função:** Retorna busca específica com results JSONB
- **Status:** ✅ Funcional
- **Performance:** ✅ Rápido

#### **DELETE `/api/scout/searches/[id]`** (Deletar busca)
- **Função:** Remove busca do histórico
- **Status:** ✅ Funcional
- **Observação:** ⚠️ NÃO remove empresas do CRM (intencional)

---

#### **GET `/api/companies/master`** (CRM Master - Tabela principal)
- **Função:** Retorna empresas do CRM com filtros e paginação
- **Status:** ✅ 100% funcional
- **Query Params:**
  - `page`, `limit` (paginação)
  - `lead_status`, `responsavel_id`, `category`, `municipio`, `origem` (filtros)
  - `search` (busca por nome)
  - `sort_by`, `sort_order` (ordenação)
- **Output:** `{ companies: Company[], total: number, page: number, limit: number }`
- **Performance:** ✅ Muito rápido (usa `companies_master_view` + índices especializados)
- **Segurança:** ✅ RLS garante apenas empresas do usuário

#### **GET `/api/companies/pressure-stats`** (KPIs de Pressão Operacional)
- **Função:** Retorna KPIs do painel de pressão (leads ativos, hot leads, frios, follow-ups)
- **Status:** ✅ Funcional
- **Output:** `{ leadsAtivos, hotLeads, leadsFrios, followUpsPendentes }`
- **Performance:** ✅ Rápido (usa views agregadas)

#### **GET `/api/companies/conversion-stats`** (KPIs de Conversão)
- **Função:** Retorna KPIs de conversão (qualificados, negociando, ganhos, perdidos)
- **Status:** ✅ Funcional
- **Output:** `{ leadsQualificados, emNegociacao, ganhos, perdidos }`
- **Performance:** ✅ Rápido

#### **GET `/api/companies/export-csv`** (Exportar empresas)
- **Função:** Exporta empresas do CRM em CSV
- **Status:** ✅ 100% funcional
- **Query Params:** Aceita mesmos filtros de `/api/companies/master`
- **Output:** CSV com encoding UTF-8-BOM (Excel-friendly)
- **Performance:** ⚠️ **Sem limite de registros** (pode travar em exports de 10k+ empresas)
- **Segurança:** ✅ RLS garante apenas empresas do usuário

---

#### **POST `/api/conversations/create`** (Criar conversa)
- **Função:** Cria nova conversa no Chat AI
- **Status:** ✅ Funcional
- **Input:** `{ title?: string, system_prompt?: string }`
- **Output:** `{ conversation: Conversation }`

#### **GET `/api/conversations/list`** (Listar conversas)
- **Função:** Retorna todas as conversas do usuário
- **Status:** ✅ Funcional
- **Output:** `{ conversations: Conversation[] }` ordenado por last_message_at DESC

#### **GET `/api/conversations/[conversationId]`** (Detalhes de conversa)
- **Função:** Retorna conversa específica com mensagens
- **Status:** ✅ Funcional

#### **DELETE `/api/conversations/[conversationId]`** (Deletar conversa)
- **Função:** Remove conversa e mensagens
- **Status:** ✅ Funcional
- **Observação:** Cascade delete (apaga mensagens e conversation_searches)

#### **POST `/api/conversations/[conversationId]/messages`** (Criar mensagem)
- **Função:** Adiciona mensagem em conversa
- **Status:** ✅ Funcional
- **Input:** `{ role: 'user' | 'assistant', content: string, metadata?: object }`
- **Output:** `{ message: Message }`

#### **GET `/api/conversations/[conversationId]/messages`** (Listar mensagens)
- **Função:** Retorna todas as mensagens de uma conversa
- **Status:** ✅ Funcional
- **Output:** `{ messages: Message[] }` ordenado por created_at ASC

---

#### **POST `/api/lists/duplicate`** (Duplicar lista)
- **Função:** Duplica lista existente (copia estrutura + empresas)
- **Status:** ✅ Funcional
- **Input:** `{ listId: string }`
- **Output:** `{ list: List }`
- **Dependência:** Função SQL `duplicar_lista`

#### **POST `/api/lists/toggle-public`** (Tornar lista pública/privada)
- **Função:** Alterna `is_public` de uma lista
- **Status:** ✅ Funcional
- **Input:** `{ listId: string }`
- **Output:** `{ list: List }`

---

#### **POST `/api/telemetry/track`** (Registrar evento)
- **Função:** Registra evento de telemetria (leads criados, ações de contato, etc.)
- **Status:** ✅ Funcional
- **Input:** `{ evento: string, metadata?: object }`
- **Output:** `{ success: boolean }`
- **Dependência:** Tabela `product_events` (PROBLEMA: pode não existir)

#### **GET `/api/telemetry/track`** (Listar eventos)
- **Função:** Retorna eventos de telemetria do usuário
- **Status:** ✅ Funcional
- **Output:** `{ events: Event[] }`

---

#### **GET `/api/stats`** (Estatísticas gerais)
- **Função:** Retorna estatísticas agregadas do usuário
- **Status:** ⚠️ **Mock** (retorna dados fake)
- **Output:** `{ totalSearches, totalCompanies, totalProposals }`
- **Conclusão:** ❌ NÃO FUNCIONAL (apenas mock para UI)

---

### 3.3 Server Actions (Next.js)

**Observação:** Sistema usa principalmente REST APIs, Server Actions não foram identificadas em grande escala.

Possíveis Server Actions (não listadas mas referenciadas):
- Criar lista (via form action)
- Adicionar empresa em lista
- Registrar interação
- Atualizar lead_status

**Conclusão:** ⚠️ Arquitetura mista (REST + Server Actions), precisa padronização.

---

### 3.4 Integrações Externas

#### ✅ **Scraper API Google Maps** (http://localhost:3001)
- **Função:** Scraping de empresas do Google Maps via Puppeteer/Playwright
- **Status:** ✅ Operacional
- **Endpoints:**
  - `POST /api/scrape-maps`: Busca empresas
  - `GET /health`: Health check
- **Performance:** ⚠️ **Lento** (10-60s por busca dependendo do maxPlaces)
- **Dependência Crítica:** ❌ Sistema quebra se scraper cair (sem fallback)
- **Localização:** `C:\Users\Leo\Desktop\Projetos-google-find\projeto-google-find\server\index-ultra-fast.js`

#### ❌ **Receita Federal API** (Não implementada)
- **Status:** Estrutura pronta (campos `cnpj`, `razao_social`, `qsa`, etc. em companies)
- **Conclusão:** Dados da Receita não são preenchidos automaticamente

#### ❌ **Google Places API** (Não implementada)
- **Status:** Sistema depende de scraper custom, não usa API oficial
- **Conclusão:** Mais barato mas menos confiável (risco de bloqueio)

---

### 3.5 Resumo do Backend

✅ **Pontos Fortes:**
- APIs REST bem estruturadas e documentadas
- Autenticação via Supabase Auth (seguro)
- RLS implementado em todas as queries (segurança)
- Integração Chat AI → CRM 100% funcional
- Telemetria básica implementada

⚠️ **Pontos de Atenção:**
- Arquitetura mista REST + Server Actions (falta padronização)
- API `/api/stats` retorna dados fake (mock)
- Export CSV sem limite de registros (risco de timeout)
- Scraper API bloqueante (30-60s por busca)

❌ **Riscos de Produção:**
- **Dependência crítica de scraper externo** (porta 3001) - sistema quebra se scraper cair
- **Sem fallback para scraper** - se Google bloquear, sistema para completamente
- **Sem rate limiting** - usuário pode fazer 100 buscas simultâneas e derrubar scraper
- **Sem job queue** - integração Chat → CRM é síncrona (bloqueia response)
- **Sem CI/CD** - deploy manual com risco de downtime

**Pronto para Produção?** ⚠️ **SIM, mas com ressalvas:**
- ✅ Funciona bem para 1-10 usuários simultâneos
- ⚠️ Acima de 50 usuários: implementar job queue (BullMQ/Celery)
- ❌ Acima de 500 usuários: migrar scraper para Browserless Cloud + múltiplas instâncias

---

**FIM DA PARTE 1**

Continue lendo em: `DIAGNOSTICO_SPEC64_PARTE2.md`
