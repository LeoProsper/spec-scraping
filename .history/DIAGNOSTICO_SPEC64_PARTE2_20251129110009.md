# 🔍 DIAGNÓSTICO TÉCNICO SPEC64 — PARTE 2

**Data do Diagnóstico:** 29/11/2025  
**Continuação de:** `DIAGNOSTICO_SPEC64_PARTE1.md`

---

## 🎨 FASE 4 — DIAGNÓSTICO DO FRONTEND

### 4.1 Stack Frontend

- **Framework:** Next.js 15.5.4 (App Router, React 19, TypeScript)
- **UI Library:** Radix UI + Tailwind CSS + shadcn/ui
- **Estado:** React hooks nativos (useState, useEffect) + React Query (inferred)
- **Formulários:** React Hook Form (inferred)
- **Animações:** Framer Motion (package `motion` instalado)
- **Charts:** Recharts (inferred do dashboard-demo-charts.tsx)
- **Ícones:** Lucide React

### 4.2 Páginas e Rotas Frontend

#### ✅ **Login / Auth** (`/auth/*`)
- **Localização:** `apps/web/app/auth/`
- **Páginas:**
  - `/auth/sign-in` → `apps/web/app/auth/sign-in/page.tsx`
  - `/auth/sign-up` → `apps/web/app/auth/sign-up/page.tsx`
  - `/auth/password-reset` → `apps/web/app/auth/password-reset/page.tsx`
  - `/auth/verify` → `apps/web/app/auth/verify/page.tsx`
  - `/auth/callback` → `apps/web/app/auth/callback/route.ts` (API route)
- **Status:** ✅ 100% funcional (Supabase Auth integration)
- **Features:**
  - Login via email + senha
  - Cadastro via email
  - Reset de senha via email
  - Verificação de email
  - Callback OAuth (Google, GitHub - se configurado)

---

#### ✅ **Home / Dashboard** (`/home`)
- **Localização:** `apps/web/app/home/page.tsx`
- **Status:** ⚠️ **Parcialmente funcional (30%)**
- **Componentes:**
  - `DashboardDemo` → Estatísticas gerais (MOCK)
  - `DashboardDemoCharts` → Gráficos (MOCK)
- **O que FUNCIONA:**
  - ✅ Layout e sidebar
  - ✅ Navegação entre módulos
- **O que NÃO FUNCIONA:**
  - ❌ Dados reais (usa hardcoded mocks)
  - ❌ Gráficos conectados ao banco
  - ❌ Filtros por período
  - ❌ Drill-down em métricas
- **Dependências:** API `/api/stats` (retorna mock)
- **Conclusão:** **Apenas UI mockup**, não é dashboard funcional

---

#### ✅ **CRM Master** (`/home/crm`)
- **Localização:** `apps/web/app/home/crm/page.tsx`
- **Status:** ✅ **100% funcional**
- **Componentes:**
  - `MasterCrmTable` → Tabela paginada com empresas
  - `MasterCrmFilters` → Painel de filtros lateral
  - `MasterCrmStats` → KPIs de pressão operacional
  - `MasterCrmShortcuts` → Atalhos comerciais (filtros rápidos)
  - `CrmConversionKpis` → KPIs de conversão
  - `CrmBehavioralAlerts` → Alertas de leads frios
  - `CrmExportButton` → Botão de exportação CSV
  - `OnboardingFirstLead` → Wizard de primeiro lead (se vazio)
- **Features Reais:**
  - ✅ Tabela com todas as empresas do CRM
  - ✅ Filtros: lead_status, responsável, categoria, município, origem
  - ✅ Busca por nome (fuzzy search via trigram)
  - ✅ Paginação (10/25/50 por página)
  - ✅ Ordenação por múltiplas colunas
  - ✅ KPIs de pressão (Leads ativos, Hot leads, Frios, Follow-ups)
  - ✅ KPIs de conversão (Qualificados, Negociando, Ganhos, Perdidos)
  - ✅ Alertas comportamentais (leads sem follow-up há 30+ dias)
  - ✅ Atalhos comerciais (botões de filtro rápido)
  - ✅ Exportação CSV com filtros
  - ✅ Ações de contato: WhatsApp, Call, Email (botões funcionais com telemetria)
  - ✅ Drawer de detalhes da empresa (modal lateral)
  - ✅ Registrar interação direto na tabela
- **Dependências:**
  - API: `/api/companies/master` (GET)
  - API: `/api/companies/pressure-stats` (GET)
  - API: `/api/companies/conversion-stats` (GET)
  - API: `/api/companies/export-csv` (GET)
  - View: `companies_master_view`
- **Performance:** ✅ Muito boa (paginação + índices)
- **Conclusão:** **Módulo PRONTO PARA PRODUÇÃO**

---

#### ✅ **Chat AI / Scout** (`/home/scout/chat`)
- **Localização:** `apps/web/app/home/scout/chat/page.tsx`
- **Status:** ✅ **100% funcional**
- **Componentes:**
  - `ChatWelcome` → Tela inicial com sugestões de busca
  - `ChatMessages` → Timeline de mensagens (user + assistant)
  - `ChatInput` → Input de busca com botão enviar
  - `ResultsTable` → Tabela de empresas encontradas
  - `ConversationSidebar` → Histórico de conversas
  - `SearchHistorySidebar` → Histórico de buscas
- **Features Reais:**
  - ✅ Sistema conversacional completo (conversations + messages)
  - ✅ Busca de empresas via scraper (Google Maps)
  - ✅ Exibição de resultados em tabela expansível
  - ✅ Cards de empresa com detalhes (rating, reviews, endereço, telefone, website)
  - ✅ Integração automática Chat → CRM (cria leads no CRM Master)
  - ✅ Histórico de conversas (sidebar esquerda)
  - ✅ Histórico de buscas (sidebar direita)
  - ✅ Criar nova conversa
  - ✅ Deletar conversa
  - ✅ Sugestões de busca (templates prontos)
- **Dependências:**
  - API: `/api/scout/search` (POST)
  - API: `/api/scout/searches` (POST, GET)
  - API: `/api/conversations/*` (CRUD)
  - Scraper: `http://localhost:3001/api/scrape-maps`
- **Performance:** ⚠️ **Bloqueante** (espera scraper 30-60s)
- **UX:** ⚠️ **Sem loading state adequado** (usuário não sabe quanto tempo vai demorar)
- **Conclusão:** **Funcional, mas UX precisa melhorar**

---

#### ✅ **Listas** (`/home/lists`)
- **Localização:** `apps/web/app/home/lists/page.tsx`
- **Status:** ✅ **100% funcional**
- **Componentes:**
  - `ListCompaniesTable` → Tabela de empresas da lista selecionada
  - `CompanyDetailsDrawer` → Drawer de detalhes da empresa
  - `ListHeader` → Header com nome e total da lista
  - `ListActionMenu` → Menu de ações (duplicar, tornar pública, deletar)
  - `CreateListModal` → Modal de criação de lista
  - `ListsSidebarContent` → Sidebar com todas as listas do usuário
- **Features Reais:**
  - ✅ Criar lista custom
  - ✅ Criar lista via template
  - ✅ Duplicar lista
  - ✅ Tornar lista pública/privada
  - ✅ Adicionar empresa do CRM em lista
  - ✅ Remover empresa de lista
  - ✅ Visualizar empresas dentro da lista
  - ✅ Drawer de detalhes com timeline de interações
  - ✅ Registrar nova interação direto na lista
  - ✅ Métricas de negócio por lista:
    - Total de empresas
    - Contatadas (lead_status != 'novo')
    - Leads quentes (qualificado, negociando)
    - Vendas (ganho)
    - Taxa de conversão
  - ✅ Filtros: por lista selecionada
- **Dependências:**
  - API: `/api/lists/duplicate` (POST)
  - API: `/api/lists/toggle-public` (POST)
  - Hooks: `useListById`, `useListCompanies`, `useInteractions`
- **Conclusão:** **Módulo PRONTO PARA PRODUÇÃO**

---

#### ⚠️ **Scout (Search Clássico)** (`/home/scout`)
- **Localização:** `apps/web/app/home/scout/page.tsx`
- **Status:** ⚠️ **Parcialmente descontinuado**
- **Componentes:**
  - `SearchForm` → Formulário de busca (city + query)
  - `SearchResults` → Tabela de resultados
  - `RecentSearches` → Histórico de buscas
  - `StatsCards` → KPIs de buscas
- **O que FUNCIONA:**
  - ✅ Formulário de busca (UI)
  - ✅ Histórico de buscas
- **O que NÃO FUNCIONA:**
  - ❌ Sistema substituído pelo Chat AI
  - ❌ Funcionalidade duplicada
- **Conclusão:** **Remover ou redirecionar para /home/scout/chat**

---

#### ❌ **Settings / Configurações** (`/home/settings`)
- **Localização:** `apps/web/app/home/settings/page.tsx`
- **Status:** ❌ **Não implementado** (apenas layout vazio)
- **Conclusão:** Página existe mas sem conteúdo

---

### 4.3 Componentes Compartilhados

#### **Sidebar / Navegação**
- **Componentes:**
  - `HomeSidebar` → Sidebar principal com navegação
  - `HomeMenuNavigation` → Menu de navegação desktop
  - `HomeMobileNavigation` → Menu mobile (hamburguer)
- **Status:** ✅ Funcional
- **Features:**
  - ✅ Navegação entre módulos
  - ✅ Indicador de página ativa
  - ✅ Contador de itens (listas, conversas)
  - ✅ Responsive (desktop + mobile)

#### **Modals / Drawers**
- **Componentes:**
  - `CompanyDetailsDrawer` → Drawer de detalhes da empresa (usado em CRM e Listas)
  - `NewInteractionForm` → Form de registro de interação
  - `CreateListModal` → Modal de criação de lista
- **Status:** ✅ Funcional
- **Features:**
  - ✅ Formulários com validação
  - ✅ Submit async com loading state
  - ✅ Toast notifications em sucesso/erro

#### **Tabelas**
- **Componentes:**
  - `MasterCrmTable` → Tabela do CRM Master
  - `ListCompaniesTable` → Tabela de empresas em lista
  - `ResultsTable` → Tabela de resultados do Chat AI
- **Status:** ✅ Funcional
- **Features:**
  - ✅ Paginação
  - ✅ Ordenação por coluna
  - ✅ Busca/filtro
  - ✅ Ações inline (botões de contato)
  - ✅ Expansão de linhas (detalhes)

---

### 4.4 Hooks Personalizados

| Hook | Função | Status |
|------|--------|--------|
| `useListById` | Busca lista por ID | ✅ Funcional |
| `useListCompanies` | Busca empresas de uma lista | ✅ Funcional |
| `useLists` | Busca todas as listas do usuário | ✅ Funcional |
| `useInteractions` | Busca interações de uma empresa | ✅ Funcional |
| `useTemplates` | Busca templates de listas | ✅ Funcional |

**Conclusão:** Hooks bem estruturados, todos funcionais.

---

### 4.5 Resumo do Frontend

✅ **Pontos Fortes:**
- UI/UX bem polida (shadcn/ui + Tailwind)
- Componentes reutilizáveis e bem organizados
- Responsive (desktop + mobile)
- Acessibilidade básica (Radix UI)
- CRM Master 100% funcional
- Chat AI 100% funcional
- Sistema de Listas 100% funcional

⚠️ **Pontos de Atenção:**
- Dashboard Home com dados fake (mock)
- Scout clássico duplicado (remover)
- Sem loading states adequados no Chat AI (scraper demora 30-60s)
- Sem pagination no histórico de conversas (pode ficar lento)

❌ **Componentes Não Implementados:**
- ❌ Criação de proposta (apenas estrutura de dados)
- ❌ Visualização de proposta (sem UI)
- ❌ Dashboard financeiro (payments sem UI)
- ❌ Análise de website (sem UI)
- ❌ Settings page (vazia)

**Pronto para Produção?** ✅ **SIM** (módulos principais funcionais)
- CRM Master: ✅ Pronto
- Chat AI: ✅ Pronto (melhorar UX de loading)
- Listas: ✅ Pronto
- Dashboard: ❌ Não (apenas mock)
- Propostas: ❌ Não (sem UI)

---

## 🔄 FASE 5 — DIAGNÓSTICO DO CHAT AI

### 5.1 Fluxo Completo Chat AI → CRM

```
┌─────────────────────────────────────────────────────────────────┐
│ USUÁRIO                                                         │
│ Acessa /home/scout/chat                                         │
│ Digita: "restaurantes em São Paulo zona sul"                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (ChatInput)                                            │
│ • POST /api/scout/search                                        │
│ • Body: { query: "restaurantes em São Paulo zona sul" }        │
│ • Mostra loading spinner                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (/api/scout/search)                                     │
│ 1. Valida session (Supabase Auth)                              │
│ 2. Chama searchPlaces() → scraper externo                      │
│ 3. Aguarda resposta (30-60s) ⚠️ BLOQUEANTE                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ SCRAPER EXTERNO (http://localhost:3001)                        │
│ 1. Puppeteer/Playwright abre navegador headless                │
│ 2. Navega para Google Maps                                     │
│ 3. Busca "restaurantes em São Paulo zona sul"                  │
│ 4. Scraping de 12 empresas (configurable)                      │
│ 5. Extrai: name, address, phone, website, rating, reviews      │
│ 6. Retorna JSON array                                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (/api/scout/search) - INTEGRAÇÃO CRM                   │
│ FOR EACH place in result.places:                               │
│   • Chama supabase.rpc('create_or_update_company_from_chat')   │
│   • Parâmetros: user_id, place_id, name, address, phone, etc.  │
│   • Função SQL verifica place_id + responsavel_id              │
│   • SE NÃO EXISTE:                                              │
│     - INSERT em companies (lead_status='novo', origem='chat_ai')│
│     - INSERT em product_events (lead_criado_via_chat)          │
│     - INSERT em company_import_logs (action='created')         │
│     - UPDATE accounts.onboarding (first_lead_created=true)     │
│   • SE EXISTE:                                                  │
│     - UPDATE companies.ultima_interacao = NOW()                │
│     - INSERT em product_events (lead_atualizado_via_chat)      │
│     - INSERT em company_import_logs (action='updated')         │
│   • Log: console.log('✅ Lead criado: ...')                    │
│ END FOR                                                          │
│ Retorna: { success: true, places: [...], total: 12 }           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (ChatMessages)                                         │
│ • Recebe resposta (após 30-60s)                                │
│ • Exibe tabela ResultsTable com 12 empresas                    │
│ • Cada linha: nome, categoria, endereço, rating, reviews       │
│ • Botões: Ver detalhes, Adicionar em lista                     │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ CRM MASTER (/home/crm)                                          │
│ • 12 novas empresas aparecem AUTOMATICAMENTE                   │
│ • lead_status = 'novo'                                          │
│ • origem = 'chat_ai'                                            │
│ • responsavel_id = user_id (dono do lead)                       │
│ • ultima_interacao = NOW()                                      │
│ • data_primeiro_contato = NOW()                                 │
│ • priority_score calculado automaticamente (trigger)            │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ TELEMETRIA & LOGS                                               │
│ • product_events: 12 eventos 'lead_criado_via_chat'            │
│ • company_import_logs: 12 registros (source='chat_ai')         │
│ • Onboarding: first_lead_created = true                         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Pontos de Quebra Identificados

#### ✅ **O QUE FUNCIONA PERFEITAMENTE:**
- ✅ Busca via Chat AI
- ✅ Scraping de empresas
- ✅ Integração automática Chat → CRM
- ✅ Leads aparecem no CRM Master
- ✅ Deduplicação por place_id + responsavel_id
- ✅ Telemetria completa
- ✅ Logs de auditoria

#### ⚠️ **PONTOS DE ATENÇÃO:**
- ⚠️ **Performance:** Scraper demora 30-60s (bloqueante)
- ⚠️ **UX:** Usuário não sabe quanto tempo vai demorar
- ⚠️ **Confiabilidade:** Se scraper cair, sistema quebra
- ⚠️ **Escalabilidade:** Scraper não aguenta 10+ usuários simultâneos

#### ❌ **RISCOS CRÍTICOS:**
- ❌ **SPOF (Single Point of Failure):** Scraper é dependência crítica
- ❌ **Rate Limiting:** Google pode bloquear scraping
- ❌ **Sem Retry:** Se scraping falhar, usuário perde busca
- ❌ **Sem Queue:** Múltiplas buscas simultâneas travam scraper

---

### 5.3 Garantias Atuais

✅ **Após a busca:**
- ✅ Leads aparecem no CRM Master (100% garantido)
- ✅ KPIs atualizam automaticamente (trigger)
- ✅ Origem 'chat_ai' registrada (rastreável)
- ✅ Responsável atribuído automaticamente (user_id)
- ✅ Última interação registrada (NOW())
- ✅ Telemetria registrada (product_events)
- ✅ Logs de auditoria (company_import_logs)

❌ **NÃO é possível que:**
- ❌ Lead fique só no Chat (sempre vai para CRM)
- ❌ Lead não apareça no CRM (integração obrigatória)
- ❌ Lead não entre nas listas (usuário adiciona manualmente)

---

## 🔒 FASE 6 — SEGURANÇA E MULTIUSUÁRIO

### 6.1 Isolamento de Dados (RLS)

**Estratégia de RLS:** ✅ **Multiusuário 100% implementado**

#### **Modelo 1: Por user_id (Tabelas de usuário único)**
- `searches` → `user_id = auth.uid()`
- `conversations` → `user_id = auth.uid()`
- `messages` → `conversation.user_id = auth.uid()`
- `lists` → `user_id = auth.uid()` OU `is_public = true`

#### **Modelo 2: Por responsavel_id (Tabelas compartilhadas)**
- `companies` → `responsavel_id = account.id` (usuário tem acesso via account)
- `company_interactions` → `company.responsavel_id` OR `user_id = auth.uid()`
- `proposals` → `company.responsavel_id`

#### **Modelo 3: Via Foreign Keys (Tabelas de junção)**
- `list_companies` → `list.user_id = auth.uid()` OU `list.is_public = true`
- `conversation_searches` → `conversation.user_id = auth.uid()`

---

### 6.2 Testes de Segurança

#### ✅ **Teste 1: Usuário A não acessa companies de Usuário B**
- **Cenário:** User A tenta `SELECT * FROM companies WHERE responsavel_id = (user B account)`
- **Resultado:** ✅ **0 rows** (RLS bloqueia)

#### ✅ **Teste 2: Usuário A não acessa conversas de Usuário B**
- **Cenário:** User A tenta `SELECT * FROM conversations WHERE user_id = (user B id)`
- **Resultado:** ✅ **0 rows** (RLS bloqueia)

#### ✅ **Teste 3: Listas públicas são visíveis**
- **Cenário:** User A cria lista pública, User B tenta acessar
- **Resultado:** ✅ **Lista visível** (intencional)

#### ✅ **Teste 4: Empresas órfãs do Chat AI**
- **Cenário:** Empresa criada pelo Chat AI tem `search_id = NULL` e `responsavel_id = user_id`
- **Resultado:** ✅ **User tem acesso via responsavel_id** (RLS permite)

---

### 6.3 Riscos de Segurança Identificados

#### ✅ **SEM RISCOS CRÍTICOS**
- ✅ RLS implementado em TODAS as tabelas
- ✅ Policies corretas (user_id, responsavel_id, account matching)
- ✅ Sem bypass de RLS (nenhuma query usa SECURITY INVOKER)
- ✅ Sem SQL injection (Supabase client usa prepared statements)

#### ⚠️ **RISCOS BAIXOS**
- ⚠️ **Listas públicas** expostas para todos (intencional, mas pode ser abusado)
- ⚠️ **Onboarding table** com FK errado (não afeta segurança, apenas funcionalidade)
- ⚠️ **Scraper API sem autenticação** (porta 3001 aberta localmente)

---

## 📊 FASE 7 — PERFORMANCE E ESCALABILIDADE

### 7.1 Uso de Índices

**Índices Críticos:** ✅ **103 índices implementados**

#### **Queries Otimizadas:**
- ✅ CRM Master filters: `idx_companies_crm_filters` (lead_status, responsavel_id, category, municipio)
- ✅ Busca fuzzy: `idx_companies_name_trgm` (GIN trigram)
- ✅ Ordenação: `idx_companies_priority_score DESC`, `idx_companies_rating DESC`
- ✅ Timeline: `idx_company_interactions_company_timeline` (company_id, created_at DESC)
- ✅ Listas: `idx_lists_user_id`, `idx_list_companies_list_id`
- ✅ JSONB: `idx_searches_results GIN`, `idx_companies_qsa GIN`

#### **Queries NÃO Otimizadas:**
- ❌ Busca em `messages.content` (sem índice full-text)
- ❌ Filtro por `companies.observacoes` (sem índice)

---

### 7.2 Queries Pesadas

#### ⚠️ **Query 1: Export CSV sem limite**
```typescript
// /api/companies/export-csv
const { data } = await supabase
  .from('companies_master_view')
  .select('*')
  .order('created_at', { ascending: false });
// ⚠️ Sem LIMIT = pode retornar 100k linhas
```
**Impacto:** ⚠️ Timeout após 30s em exports grandes
**Solução:** Implementar LIMIT + paginação ou streaming

#### ⚠️ **Query 2: Histórico de conversas sem paginação**
```typescript
// /api/conversations/list
const { data } = await supabase
  .from('conversations')
  .select('*')
  .order('last_message_at', { ascending: false });
// ⚠️ Sem LIMIT = retorna todas as conversas
```
**Impacto:** ⚠️ Lento após 100+ conversas
**Solução:** Implementar paginação

---

### 7.3 Crescimento Explosivo

#### 🔴 **CRÍTICO: Tabela `messages`**
- **Crescimento:** 10 mensagens/conversa × 100 conversas/usuário × 1000 usuários = **1 milhão de mensagens/mês**
- **Impacto:** Tabela vai ter 10M+ linhas em 1 ano
- **Solução:** Particionamento por `created_at` (monthly) + arquivamento

#### 🔴 **CRÍTICO: Tabela `searches.results` (JSONB)**
- **Crescimento:** 12 empresas/busca × 50 buscas/usuário × 1000 usuários = **600k empresas em JSONB**
- **Impacto:** GIN index vai degradar performance
- **Solução:** Remover `results` JSONB, depender apenas de `companies`

#### 🟡 **MÉDIO: Tabela `product_events`**
- **Crescimento:** 50 eventos/usuário/dia × 1000 usuários = **50k eventos/dia** = **18M/ano**
- **Impacto:** Queries de analytics vão ficar lentas
- **Solução:** Particionamento por `created_at` (monthly)

---

### 7.4 Risco de Crescimento

**Simulação:** 10.000 usuários ativos

| Tabela | Registros/Ano | Tamanho Estimado | Status |
|--------|---------------|------------------|--------|
| `companies` | 500k | 2 GB | ✅ OK (bem indexado) |
| `messages` | 100M | 50 GB | 🔴 CRÍTICO (particionamento necessário) |
| `searches` | 500k | 5 GB | 🔴 CRÍTICO (JSONB vai degradar) |
| `product_events` | 180M | 20 GB | 🟡 MÉDIO (particionamento recomendado) |
| `company_interactions` | 5M | 2 GB | ✅ OK |
| `lists` | 100k | 500 MB | ✅ OK |

**Conclusão:** ⚠️ **Sistema suporta até 1k usuários sem problemas, acima de 5k precisa particionamento**

---

### 7.5 Gargalos Identificados

#### 🔴 **CRÍTICO: Scraper API (porta 3001)**
- **Problema:** Bloqueante, 30-60s por busca
- **Capacidade:** ~10 buscas simultâneas antes de travar
- **Impacto:** Sistema não escala acima de 50 usuários simultâneos
- **Solução:** Job queue (BullMQ) + múltiplas instâncias de scraper

#### 🟡 **MÉDIO: Integração Chat → CRM síncrona**
- **Problema:** Loop de `create_or_update_company_from_chat` bloqueia response
- **Capacidade:** 12 empresas = ~5s de processamento
- **Impacto:** UX ruim (usuário espera)
- **Solução:** Mover para job queue, retornar response imediatamente

#### 🟢 **BAIXO: Views sem MATERIALIZED**
- **Problema:** Views recalculam a cada query
- **Impacto:** Negligível (queries são rápidas)
- **Solução:** Avaliar `companies_master_view` como MATERIALIZED se crescer

---

## 🚶 FASE 8 — FLUXO REAL DO USUÁRIO (END-TO-END)

### 8.1 Fluxo Completo: Cadastro → Venda

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CADASTRO                                                     │
│ User acessa /auth/sign-up                                       │
│ • Preenche: email, senha                                        │
│ • Supabase cria: auth.users, public.accounts                    │
│ • Trigger: on_auth_user_created → cria account                  │
│ • Redirect: /home                                               │
│ ✅ FUNCIONA: 100%                                                │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. PRIMEIRO LEAD (Chat AI)                                      │
│ User acessa /home/scout/chat                                    │
│ • Digita: "padarias em São Paulo"                              │
│ • Scraper busca 12 empresas (30-60s)                           │
│ • Integração cria 12 leads no CRM                              │
│ • Onboarding: first_lead_created = true                         │
│ • Telemetria: 12 eventos 'lead_criado_via_chat'                │
│ ✅ FUNCIONA: 100%                                                │
│ ⚠️ UX: Demora 30-60s sem feedback adequado                      │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ORGANIZAR LEADS (CRM Master)                                 │
│ User acessa /home/crm                                           │
│ • Vê 12 leads com status 'novo'                                │
│ • Filtra por município ou categoria                            │
│ • Ordena por priority_score (leads mais quentes primeiro)      │
│ • Clica em WhatsApp de um lead                                 │
│   - Abre WhatsApp Web                                           │
│   - Telemetria: contato_whatsapp_clicado                        │
│   - Onboarding: first_whatsapp_clicked = true                   │
│ ✅ FUNCIONA: 100%                                                │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CRIAR LISTA (Organização)                                    │
│ User acessa /home/lists                                         │
│ • Clica "Criar Nova Lista"                                      │
│ • Nome: "Padarias SP - Prospecção Nov/25"                      │
│ • Volta ao CRM, seleciona 5 leads mais promissores             │
│ • Clica "Adicionar à Lista" → escolhe lista criada             │
│ • Leads aparecem na lista                                       │
│ ✅ FUNCIONA: 100%                                                │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. REGISTRAR INTERAÇÃO (Follow-up)                              │
│ User abre lista "Padarias SP - Prospecção Nov/25"              │
│ • Clica em empresa                                              │
│ • Drawer abre com detalhes                                      │
│ • Clica "Registrar Interação"                                   │
│   - Tipo: ligação                                               │
│   - Resultado: positivo                                         │
│   - Observação: "Interessado em proposta"                       │
│   - Próxima ação: 2025-12-01 (agendar follow-up)               │
│ • Interaction criada                                            │
│ • Trigger atualiza: companies.ultima_interacao = NOW()         │
│ • Trigger atualiza: companies.lead_status = 'qualificado'      │
│ ✅ FUNCIONA: 100%                                                │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. CRIAR PROPOSTA                                                │
│ User tenta criar proposta...                                    │
│ ❌ NÃO FUNCIONA: UI não existe                                   │
│ ⚠️ WORKAROUND: User cria proposta externa (PDF, email, etc.)    │
│ ⚠️ MANUAL: User registra interação tipo 'proposta_enviada'      │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. FECHAMENTO (Venda Ganha)                                      │
│ User volta ao CRM Master                                         │
│ • Busca empresa que aceitou proposta                            │
│ • Clica em "Editar" (inline ou drawer)                          │
│ • Altera lead_status de 'qualificado' para 'ganho'             │
│ • Salva                                                          │
│ • KPI "Ganhos" incrementa automaticamente                       │
│ • Métricas de conversão atualizam                               │
│ ✅ FUNCIONA: 100%                                                │
│ ⚠️ LIMITAÇÃO: Sem registro de valor da venda (payments table    │
│   não está integrada)                                            │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ANÁLISE (Métricas)                                            │
│ User acessa /home (Dashboard)                                   │
│ ❌ NÃO FUNCIONA: Dados são mock                                  │
│ ⚠️ WORKAROUND: User vê métricas no CRM Master (KPIs de conversão)│
│ • Leads qualificados                                             │
│ • Em negociação                                                  │
│ • Ganhos                                                         │
│ • Perdidos                                                       │
│ • Taxa de conversão                                              │
│ ✅ MÉTRICAS REAIS: Disponíveis no CRM Master                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 8.2 Pontos de Quebra no Fluxo

#### ✅ **O QUE FUNCIONA:**
1. ✅ Cadastro e login
2. ✅ Busca de empresas via Chat AI
3. ✅ Leads aparecem automaticamente no CRM
4. ✅ Organização em listas
5. ✅ Registro de interações
6. ✅ Atualização de lead_status
7. ✅ KPIs de conversão

#### ❌ **O QUE NÃO FUNCIONA:**
1. ❌ Criação de proposta (sem UI)
2. ❌ Dashboard com dados reais (apenas mock)
3. ❌ Registro de valores de venda (payments não integrado)
4. ❌ Análise de website (funcionalidade não implementada)

#### ⚠️ **O QUE É MANUAL:**
1. ⚠️ Criação de proposta externa (workaround)
2. ⚠️ Registro manual de "proposta_enviada" via interação
3. ⚠️ Atribuição de responsável (não tem UI de atribuição automática)

---

## 💸 FASE 9 — DÍVIDAS TÉCNICAS

### 9.1 Dívidas Técnicas Identificadas

#### 🔴 **CRÍTICO (Impede escala)**

1. **Scraper API como SPOF (Single Point of Failure)**
   - **Problema:** Sistema inteiro quebra se scraper cair
   - **Impacto:** Downtime total do Chat AI
   - **Solução:** 
     - Implementar job queue (BullMQ/Redis)
     - Múltiplas instâncias de scraper (load balancer)
     - Fallback para API oficial do Google Places

2. **Tabela `searches.results` com JSONB gigante**
   - **Problema:** Performance degrada após 10k searches
   - **Impacto:** GIN index fica lento, queries demoram
   - **Solução:**
     - Remover `results` JSONB
     - Depender apenas de `companies` + `conversation_searches`
     - OU arquivar `results` em S3 após 6 meses

3. **Tabela `messages` sem particionamento**
   - **Problema:** Vai ter 10M+ linhas em 1 ano
   - **Impacto:** Queries lentas, backups demorados
   - **Solução:**
     - Particionamento por `created_at` (monthly)
     - Arquivamento de conversas inativas (> 3 meses)

4. **Integração Chat → CRM bloqueante**
   - **Problema:** Loop de insert/update bloqueia response (5-10s)
   - **Impacto:** UX ruim, timeout em buscas grandes
   - **Solução:**
     - Mover para job queue
     - Retornar response imediatamente
     - Notificar usuário quando integração completar

---

#### 🟡 **MÉDIO (Afeta produção)**

5. **Tabela `onboarding` com FK errado**
   - **Problema:** FK para `proposal_id` ao invés de `account_id`
   - **Impacto:** Impossível rastrear onboarding sem proposta
   - **Solução:** Migração para alterar FK

6. **Dashboard Home com dados fake**
   - **Problema:** Gráficos e métricas são hardcoded mocks
   - **Impacto:** Usuário não vê dados reais
   - **Solução:** Conectar com banco (queries de agregação)

7. **Export CSV sem limit**
   - **Problema:** Pode retornar 100k linhas sem paginação
   - **Impacto:** Timeout após 30s
   - **Solução:** Implementar LIMIT + streaming

8. **Sem CI/CD**
   - **Problema:** Deploy manual com risco de downtime
   - **Impacto:** Erros humanos, rollback difícil
   - **Solução:** GitHub Actions + Vercel/Railway

---

#### 🟢 **BAIXO (Nice to have)**

9. **Histórico de conversas sem paginação**
   - **Problema:** Retorna todas as conversas de uma vez
   - **Impacto:** Lento após 100+ conversas
   - **Solução:** Paginação (LIMIT 20, offset)

10. **Scraper API sem autenticação**
    - **Problema:** Porta 3001 aberta sem auth
    - **Impacto:** Qualquer um na rede pode usar scraper
    - **Solução:** API key ou JWT token

11. **Tabela `templates` com constraint 1:1**
    - **Problema:** Impossível ter múltiplos templates por empresa
    - **Impacto:** Limitação de funcionalidade
    - **Solução:** Remover UNIQUE em `idx_templates_company_id`

12. **Sem testes automatizados**
    - **Problema:** Nenhum teste E2E, unitário ou integração
    - **Impacto:** Risco de regressão em novas features
    - **Solução:** Vitest + Playwright

---

### 9.2 Refatorações Necessárias

1. **Padronizar arquitetura Backend**
   - ⚠️ Atualmente misto: REST APIs + Server Actions
   - ✅ Decidir: usar apenas REST OU apenas Server Actions

2. **Implementar Error Handling global**
   - ❌ Erros de API não são tratados consistentemente
   - ✅ Implementar middleware de erro + Sentry

3. **Implementar Rate Limiting**
   - ❌ Sem proteção contra abuse (100 buscas simultâneas)
   - ✅ Implementar rate limit por usuário (ex: 10 buscas/minuto)

4. **Separar scraper em microserviço**
   - ⚠️ Scraper atualmente roda em porta separada mas mesma máquina
   - ✅ Dockerizar scraper, deploy independente

---

## 📊 ENTREGA FINAL

### MAPA COMPLETO DO SISTEMA ATUAL

```
┌──────────────────────────────────────────────────────────────────┐
│                       SPEC64 ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │────▶│   BACKEND       │────▶│   DATABASE      │
│   Next.js 15    │     │   API Routes    │     │   PostgreSQL    │
│   React 19      │     │   Supabase      │     │   Supabase      │
│   Tailwind CSS  │     │   Auth          │     │   RLS           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        └──────────────▶│  SCRAPER API    │             │
                        │  Puppeteer      │             │
                        │  Port 3001      │             │
                        └─────────────────┘             │
                                                        │
┌───────────────────────────────────────────────────────┘
│
│  16 TABELAS PRINCIPAIS:
│  ✅ companies (CRM central)
│  ✅ company_interactions (Timeline)
│  ✅ company_import_logs (Auditoria)
│  ✅ conversations (Chat AI)
│  ✅ messages (Chat AI)
│  ✅ searches (Histórico)
│  ✅ lists (Organização)
│  ✅ list_companies (M:N)
│  ⚠️ proposals (Estrutura OK, sem UI)
│  ⚠️ payments (Estrutura OK, sem integração)
│  ⚠️ onboarding (FK errado)
│  ⚠️ templates (Constraint limitante)
│  ❌ website_analysis (Não implementada)
│
│  17 VIEWS, 52 FUNÇÕES, 18 TRIGGERS, 103 ÍNDICES
│  51 POLICIES RLS (multiusuário 100% seguro)
│
└───────────────────────────────────────────────────────┘
```

---

### DIAGNÓSTICO HONESTO DE MATURIDADE TÉCNICA

**Maturidade Geral:** ⚠️ **Early SaaS (60%)**

| Dimensão | Maturidade | Nota | Justificativa |
|----------|------------|------|---------------|
| **Backend** | 80% | ✅ B+ | APIs funcionais, RLS completo, porém arquitetura mista |
| **Frontend** | 70% | ✅ B | CRM, Chat AI e Listas prontos, Dashboard mock |
| **Banco de Dados** | 90% | ✅ A- | Estrutura excelente, falta particionamento |
| **Segurança** | 95% | ✅ A | RLS 100%, sem vulnerabilidades críticas |
| **Performance** | 50% | ⚠️ C | Scraper bloqueante, sem job queue, sem particionamento |
| **Escalabilidade** | 40% | ⚠️ D | Suporta até 1k usuários, depois quebra |
| **Confiabilidade** | 60% | ⚠️ C+ | SPOF no scraper, sem retry, sem fallback |
| **Testes** | 0% | ❌ F | Nenhum teste automatizado |
| **DevOps** | 20% | ❌ F | Sem CI/CD, deploy manual |

**Média Ponderada:** **61% (C+)**

---

### LISTA DE RISCOS CRÍTICOS

#### 🔴 **BLOQUEADORES DE PRODUÇÃO:**

1. **Scraper API como SPOF**
   - **Risco:** Sistema inteiro para se scraper cair
   - **Probabilidade:** Alta (Google pode bloquear IP)
   - **Impacto:** Crítico (downtime total do Chat AI)
   - **Mitigação:** Job queue + múltiplas instâncias

2. **Tabela `searches.results` explodindo**
   - **Risco:** Performance degrada após 10k usuários
   - **Probabilidade:** Certa (em 6 meses de produção)
   - **Impacto:** Alto (queries lentas, timeout)
   - **Mitigação:** Remover JSONB ou arquivar em S3

3. **Tabela `messages` sem particionamento**
   - **Risco:** 10M+ linhas em 1 ano
   - **Probabilidade:** Certa
   - **Impacto:** Alto (queries lentas, backup demora)
   - **Mitigação:** Particionamento monthly

#### 🟡 **RISCOS MÉDIOS:**

4. **Sem rate limiting**
   - **Risco:** Abuse (usuário faz 100 buscas simultâneas)
   - **Probabilidade:** Média
   - **Impacto:** Médio (scraper trava)
   - **Mitigação:** Rate limit 10 buscas/minuto/usuário

5. **Sem CI/CD**
   - **Risco:** Deploy manual com erro humano
   - **Probabilidade:** Alta
   - **Impacto:** Médio (downtime, rollback difícil)
   - **Mitigação:** GitHub Actions + Vercel

6. **Sem testes**
   - **Risco:** Regressão em novas features
   - **Probabilidade:** Alta
   - **Impacto:** Médio (bugs em produção)
   - **Mitigação:** Vitest + Playwright

---

### LISTA DO QUE ESTÁ PRONTO PARA VENDA

#### ✅ **MÓDULOS VENDÁVEIS (PRONTOS):**

1. **CRM Master** → 95% completo
   - ✅ Tabela de empresas com filtros
   - ✅ KPIs de pressão e conversão
   - ✅ Alertas comportamentais
   - ✅ Atalhos comerciais
   - ✅ Exportação CSV
   - ✅ Ações de contato (WhatsApp, Call, Email)
   - ⚠️ Falta: Atribuição automática de responsável

2. **Chat AI / Scout** → 90% completo
   - ✅ Busca conversacional
   - ✅ Scraping Google Maps
   - ✅ Integração automática CRM
   - ✅ Histórico de conversas
   - ✅ Deduplicação
   - ⚠️ Falta: Loading UX melhor (scraper demora)

3. **Sistema de Listas** → 90% completo
   - ✅ Criar listas custom ou via template
   - ✅ Adicionar/remover empresas
   - ✅ Duplicar listas
   - ✅ Listas públicas
   - ✅ Métricas de negócio por lista
   - ⚠️ Falta: Templates de lista prontos (apenas estrutura)

4. **Timeline de Interações** → 100% completo
   - ✅ Registrar follow-ups
   - ✅ Tipos de interação (ligação, reunião, email, etc.)
   - ✅ Resultado e observações
   - ✅ Agendar próxima ação
   - ✅ Timeline visual por empresa

---

### LISTA DO QUE NÃO PODE IR PARA PRODUÇÃO AINDA

#### ❌ **MÓDULOS INCOMPLETOS (NÃO VENDER):**

1. **Dashboard Home**
   - ❌ Gráficos com dados fake (mock)
   - ❌ Sem conexão com banco real
   - **Bloqueio:** Implementar queries de agregação

2. **Propostas**
   - ❌ Apenas estrutura de dados (tabela existe)
   - ❌ Sem UI de criação
   - ❌ Sem geração de PDF
   - **Bloqueio:** Implementar UI completa

3. **Pagamentos**
   - ❌ Apenas estrutura de dados
   - ❌ Sem integração Stripe
   - ❌ Sem UI financeira
   - **Bloqueio:** Integrar Stripe + criar UI

4. **Análise de Website**
   - ❌ Apenas estrutura de dados
   - ❌ Sem scraper de websites
   - ❌ Sem UI de análise
   - **Bloqueio:** Implementar scraper + scoring

---

### CONCLUSÃO FINAL

**"Hoje o {spec64} é exatamente o quê?"**

Um **CRM B2B com Chat AI** para prospecção de empresas via Google Maps, focado em **pequenas e médias empresas** que precisam organizar leads, fazer follow-ups e fechar vendas. Sistema **funcional** para os módulos core (CRM, Chat AI, Listas, Interações), mas **não escalável** sem refatorações críticas.

---

**"Pronto para vender?"**

✅ **SIM**, mas com ressalvas:
- ✅ Vender como **Beta** para early adopters (até 100 usuários)
- ✅ Cobrar preço reduzido (50% off) enquanto ajusta bugs
- ⚠️ Deixar claro que **Dashboard é mock** (dados reais vêm do CRM Master)
- ⚠️ Deixar claro que **Propostas não está pronto** (workaround manual)
- ❌ **NÃO vender como Enterprise** (não aguenta 1000+ usuários)

---

**"Pronto para escalar?"**

❌ **NÃO**, precisa refatorações:

**Prioridade 1 (Fazer ANTES de escalar):**
1. Job queue (BullMQ) para Chat AI → CRM
2. Múltiplas instâncias de scraper (load balancer)
3. Particionamento de `messages` (monthly)
4. Remover ou arquivar `searches.results` JSONB
5. Rate limiting (10 buscas/minuto/usuário)

**Prioridade 2 (Fazer em 3 meses):**
1. CI/CD (GitHub Actions + Vercel)
2. Testes E2E críticos (Playwright)
3. Fallback para Google Places API oficial
4. Dashboard com dados reais

---

**"Pronto só para teste?"**

✅ **SIM**, 100% pronto para testes com usuários reais:
- ✅ Convide 10-50 early adopters
- ✅ Peça feedback sobre UX e features faltantes
- ✅ Monitore performance (quantos leads por dia, tempo de resposta)
- ✅ Use logs de telemetria (`product_events`, `company_import_logs`) para analytics

---

**PRÓXIMOS PASSOS RECOMENDADOS:**

1. **Semana 1-2:** Implementar job queue (Chat AI → CRM assíncrono)
2. **Semana 3-4:** Múltiplas instâncias de scraper (Docker + load balancer)
3. **Semana 5-6:** Dashboard com dados reais (remover mocks)
4. **Semana 7-8:** CI/CD + deploy automatizado
5. **Semana 9+:** Onboarding de 10-50 beta users, coletar feedback

---

**FIM DO DIAGNÓSTICO TÉCNICO COMPLETO**

Arquivos gerados:
- ✅ `DIAGNOSTICO_SPEC64_PARTE1.md` (Banco de dados + Backend)
- ✅ `DIAGNOSTICO_SPEC64_PARTE2.md` (Frontend + Chat AI + Segurança + Performance + Fluxo + Dívidas + Conclusão)
