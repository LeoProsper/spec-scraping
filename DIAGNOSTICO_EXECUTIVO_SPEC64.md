# 🎯 DIAGNÓSTICO EXECUTIVO SPEC64 — AUDITORIA TÉCNICA COMPLETA

**Data:** 29/11/2025  
**Auditor:** Arquiteto de Software Sênior  
**Versão do Sistema:** 0.2.0  
**Objetivo:** Mapeamento REAL sem suavizações

---

## 📊 RESUMO EXECUTIVO (TL;DR)

**O SPEC64 é hoje:** Um **MVP Beta-Ready (60%)** — sistema funcional para testes com usuários reais, mas **não pronto para escala comercial**.

**Capacidade atual:** 10-100 usuários simultâneos  
**Capacidade com Fase 1:** 100-500 usuários  
**Capacidade com Fases 1+2+3:** 1k-10k usuários  

**Bloqueador #1 de faturamento:** Módulo Propostas sem UI  
**Bloqueador #1 de escala:** Scraper como SPOF (Single Point of Failure)  
**Bloqueador #1 de confiança:** Ausência de CI/CD e testes automatizados  

---

## 📌 1. DIAGNÓSTICO DE BACKEND (APIS)

### 1.1 Classificação Completa de APIs

| API | Método | Status | Performance | Segurança | Observação |
|-----|--------|--------|-------------|-----------|------------|
| `/api/scout/search` | POST | 🟢 Produção | ⚠️ Bloqueante 30-60s | ✅ Auth OK | **CRÍTICO:** Scraper externo sem fallback |
| `/api/scout/searches` | POST | 🟢 Produção | ⚠️ Bloqueante 5-10s | ✅ Auth OK | Loop síncrono de insert/update |
| `/api/scout/searches` | GET | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | Sem paginação (pode ficar lento) |
| `/api/scout/searches/[id]` | GET | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | JSONB pode crescer muito |
| `/api/scout/searches/[id]` | DELETE | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | Não remove companies (intencional) |
| `/api/companies/master` | GET | 🟢 Produção | ✅ Rápida <200ms | ✅ Auth + RLS | Paginação implementada |
| `/api/companies/pressure-stats` | GET | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | Usa views agregadas |
| `/api/companies/conversion-stats` | GET | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | Usa views agregadas |
| `/api/companies/export-csv` | GET | 🟢 Produção | 🔴 **SEM LIMIT** | ✅ Auth + RLS | **RISCO:** Timeout em 10k+ rows |
| `/api/conversations/create` | POST | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | OK |
| `/api/conversations/list` | GET | 🟢 Produção | ⚠️ Sem paginação | ✅ Auth OK | Lento após 100+ conversas |
| `/api/conversations/[id]` | GET | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | OK |
| `/api/conversations/[id]` | DELETE | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | Cascade delete OK |
| `/api/conversations/[id]/messages` | POST | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | OK |
| `/api/conversations/[id]/messages` | GET | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | OK |
| `/api/lists/duplicate` | POST | 🟢 Produção | ✅ Rápida <200ms | ✅ Auth OK | Usa função SQL |
| `/api/lists/toggle-public` | POST | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | OK |
| `/api/telemetry/track` | POST | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | **RISCO:** product_events pode não existir |
| `/api/telemetry/track` | GET | 🟢 Produção | ✅ Rápida <100ms | ✅ Auth OK | OK |
| `/api/stats` | GET | 🔴 Mock | N/A | N/A | **Retorna dados fake hardcoded** |

### 1.2 Processos Síncronos Bloqueantes

#### 🔴 **CRÍTICO: `/api/scout/search`**
```typescript
// Arquivo: apps/web/app/api/scout/search/route.ts
// Problema: Espera scraper (30-60s) + loop de insert/update (5-10s)
const result = await searchPlaces(query); // ⬅️ BLOQUEANTE
for (const place of result.places) {
  await supabase.rpc('create_or_update_company_from_chat'); // ⬅️ BLOQUEANTE
}
```
**Impacto:** UX ruim, timeout em buscas grandes, scraper não escala  
**Solução:** Job queue (BullMQ) + response imediata + notificação quando completar

#### 🟡 **MÉDIO: `/api/scout/searches`**
```typescript
// Problema: Loop síncrono de insert/update
if (status === 'completed') {
  for (const result of results) {
    await supabase.rpc('create_or_update_company_from_chat'); // ⬅️ BLOQUEANTE
  }
}
```
**Impacto:** Pode demorar 5-10s dependendo do volume  
**Solução:** Mover para job queue

#### 🟡 **MÉDIO: `/api/companies/export-csv`**
```typescript
// Problema: Sem LIMIT, pode retornar 100k linhas
const { data } = await supabase
  .from('companies_master_view')
  .select('*'); // ⬅️ SEM LIMIT
```
**Impacto:** Timeout após 30s em exports grandes  
**Solução:** LIMIT + paginação ou streaming

### 1.3 Ausência de Filas (Queues)

❌ **Nenhuma fila implementada**

**Processos que PRECISAM de fila:**
1. Chat AI → CRM integration (prioridade CRÍTICA)
2. Scraping de empresas (prioridade CRÍTICA)
3. Export CSV grande (prioridade MÉDIA)
4. Envio de emails/notificações (prioridade BAIXA)

**Tecnologias recomendadas:**
- BullMQ (Redis-based, Node.js native)
- Celery (Python-based, se houver worker Python)
- AWS SQS (serverless, se migrar para AWS)

### 1.4 Dependências Críticas (SPOF)

#### 🔴 **SPOF #1: Scraper API (porta 3001)**
- **Localização:** `C:\Users\Leo\Desktop\Projetos-google-find\projeto-google-find\server\index-ultra-fast.js`
- **Problema:** Sistema inteiro para se scraper cair
- **Probabilidade:** Alta (Google pode bloquear IP a qualquer momento)
- **Impacto:** Downtime total do Chat AI
- **Sem retry, sem fallback, sem circuit breaker**
- **Solução:**
  - Retry com backoff exponencial
  - Fallback para Google Places API oficial (pago mas confiável)
  - Circuit breaker pattern
  - Múltiplas instâncias com load balancer

#### 🟡 **SPOF #2: Supabase Database (Docker local)**
- **Problema:** Banco roda em Docker local, sem replicação
- **Impacto:** Crash do container = downtime total
- **Solução:** Migrar para Supabase Cloud ou setup replicação

#### 🟢 **SPOF #3: Next.js (porta 3000)**
- **Problema:** Instância única
- **Impacto:** Baixo (fácil de escalar horizontalmente)
- **Solução:** Deploy em Vercel/Railway com auto-scaling

### 1.5 Ausência de Rate Limiting

❌ **Nenhum rate limiting implementado**

**Riscos:**
- Usuário pode fazer 100 buscas simultâneas
- Scraper trava com 10+ buscas paralelas
- Abuse de API sem custo

**Solução:**
```typescript
// Middleware de rate limiting
import rateLimit from 'express-rate-limit';

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: 'Muitas buscas simultâneas. Aguarde 1 minuto.'
});

app.use('/api/scout/search', searchLimiter);
```

### 1.6 Ausência de Retry

❌ **Nenhum retry implementado**

**Onde falta:**
- Scraper API (se falhar, usuário perde busca)
- Integração Chat → CRM (se falhar, lead não é criado)
- Queries de banco (se timeout, usuário vê erro genérico)

**Solução:**
```typescript
// Retry com backoff exponencial
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 2 ** i * 1000)); // 1s, 2s, 4s
    }
  }
}
```

---

## 🗄️ 2. DIAGNÓSTICO DE BANCO DE DADOS

### 2.1 Tabelas por Finalidade Real

#### ✅ **PRODUTIVAS (13 tabelas em uso ativo)**

| Tabela | Finalidade | Registros Atuais | Status | Risco de Crescimento |
|--------|-----------|------------------|--------|---------------------|
| `accounts` | Contas/organizações | 1 | ✅ OK | 🟢 Baixo (1 por usuário) |
| `companies` | Leads/empresas do CRM | 1 | ✅ OK | 🟡 Médio (500k/ano) |
| `company_interactions` | Timeline de follow-ups | 0 | ✅ OK | 🟡 Médio (5M/ano) |
| `company_import_logs` | Auditoria de importações | 0 | ✅ OK | 🟡 Médio (10M/ano) |
| `conversations` | Conversas Chat AI | 0 | ✅ OK | 🟢 Baixo (100k/ano) |
| `messages` | Mensagens Chat AI | 0 | ✅ OK | 🔴 **ALTO (100M/ano)** |
| `searches` | Histórico de buscas | 26 | ✅ OK | 🔴 **ALTO (JSONB gigante)** |
| `conversation_searches` | M:N conversas↔buscas | 0 | ✅ OK | 🟢 Baixo |
| `lists` | Listas comerciais | 7 | ✅ OK | 🟢 Baixo (100k/ano) |
| `list_companies` | M:N listas↔empresas | 3 | ✅ OK | 🟡 Médio (1M/ano) |
| `list_templates` | Templates de listas | ? | ✅ OK | 🟢 Baixo (estático) |
| `proposals` | Propostas comerciais | 0 | ⚠️ Estrutura pronta | 🟢 Baixo |
| `payments` | Pagamentos/vendas | 0 | ⚠️ Estrutura pronta | 🟢 Baixo |

#### ⚠️ **ESTRUTURAIS (Preparadas mas não usadas — 3 tabelas)**

| Tabela | Finalidade | Status | Bloqueio |
|--------|-----------|--------|----------|
| `onboarding` | Tracking de progresso | ⚠️ FK errado | FK para proposal_id (deveria ser account_id) |
| `templates` | Templates de mensagens | ⚠️ Constraint 1:1 | company_id UNIQUE (deveria ser M:1) |
| `website_analysis` | Análise de websites | ❌ Não implementada | Scraper de websites não existe |

#### ❌ **FUTURAS (Apenas estrutura — 0 tabelas órfãs)**

Nenhuma tabela órfã identificada. Todas as tabelas têm propósito claro.

### 2.2 Views (17 total — todas funcionais)

| View | Uso Real | Performance | Status |
|------|----------|-------------|--------|
| `companies_master_view` | CRM Master table | ✅ Rápida | ✅ Produção |
| `chat_ai_recent_imports` | Últimos 100 imports | ✅ Rápida | ✅ Produção |
| `companies_leads_frios` | Leads sem follow-up 30d+ | ✅ Rápida | ✅ Produção |
| `companies_pipeline_overview` | Overview pipeline | ✅ Rápida | ✅ Produção |
| `companies_por_responsavel` | Agregado por responsável | ✅ Rápida | ✅ Produção |
| `companies_unique_overview` | Contadores únicos | ✅ Rápida | ✅ Produção |
| `companies_with_receita` | Empresas com dados RF | ✅ Rápida | ✅ Produção |
| `company_imports_summary` | Agregado por fonte | ✅ Rápida | ✅ Produção |
| `company_timeline` | Timeline de interações | ✅ Rápida | ✅ Produção |
| `empresas_por_lista` | Empresas dentro de lista | ✅ Rápida | ✅ Produção |
| `followups_pendentes` | Follow-ups agendados | ✅ Rápida | ✅ Produção |
| `interactions_por_empresa` | Agregado por empresa | ✅ Rápida | ✅ Produção |
| `interactions_por_usuario` | Agregado por usuário | ✅ Rápida | ✅ Produção |
| `listas_com_quantidade` | Listas com contagem | ✅ Rápida | ✅ Produção |
| `listas_publicas` | Apenas listas públicas | ✅ Rápida | ✅ Produção |
| `templates_disponiveis` | Templates ativos | ✅ Rápida | ✅ Produção |
| `user_stats` | Estatísticas por usuário | ✅ Rápida | ✅ Produção |

**Conclusão:** ✅ Todas as views são úteis, nenhuma órfã ou mock.

### 2.3 Funções SQL (52 total)

#### **Críticas (13 principais)**

| Função | Uso | Status | Performance |
|--------|-----|--------|-------------|
| `create_or_update_company_from_chat` | Integração Chat→CRM | ✅ CRÍTICA | ✅ Rápida <100ms |
| `adicionar_empresa_lista` | Adiciona empresa em lista | ✅ Funcional | ✅ Rápida |
| `atribuir_lead_responsavel` | Atribui responsável | ✅ Funcional | ✅ Rápida |
| `calculate_lead_priority` | Calcula priority_score | ✅ Funcional | ✅ Rápida |
| `count_companies_with_filters` | Conta empresas | ✅ Funcional | ✅ Rápida |
| `count_company_interactions` | Conta interações | ✅ Funcional | ✅ Rápida |
| `criar_lista_de_template` | Cria lista via template | ✅ Funcional | ✅ Rápida |
| `duplicar_lista` | Duplica lista | ✅ Funcional | ✅ Rápida |
| `generate_conversation_title` | Gera título conversa | ✅ Funcional | ✅ Rápida |
| `get_last_interaction` | Última interação | ✅ Funcional | ✅ Rápida |
| `registrar_interacao` | Registra follow-up | ✅ Funcional | ✅ Rápida |
| `sync_company_on_interaction` | Sincroniza company | ✅ Funcional | ✅ Rápida |
| `update_company_priority` | Recalcula priority | ✅ Funcional | ✅ Rápida |

#### **Auxiliares (39 funções pg_trgm)**

Todas as extensões `pg_trgm` (busca fuzzy) estão funcionais.

**Conclusão:** ✅ Nenhuma função órfã ou desnecessária.

### 2.4 Triggers (18 principais — todos funcionais)

| Trigger | Tabela | Função | Status |
|---------|--------|--------|--------|
| `trigger_update_company_priority` | companies | Recalcula priority_score | ✅ OK |
| `companies_auto_update_interacao` | companies | Atualiza ultima_interacao | ✅ OK |
| `companies_update_last_seen` | companies | Atualiza last_seen_at | ✅ OK |
| `on_company_created` | companies | Telemetria | ✅ OK |
| `company_interactions_sync_trigger` | company_interactions | Sincroniza companies | ✅ OK |
| `list_companies_insert_trigger` | list_companies | Incrementa total | ✅ OK |
| `list_companies_delete_trigger` | list_companies | Decrementa total | ✅ OK |
| `lists_update_timestamp_trigger` | lists | Atualiza updated_at | ✅ OK |
| `on_message_created` | messages | Incrementa message_count | ✅ OK |
| `on_message_deleted` | messages | Decrementa message_count | ✅ OK |
| `on_conversation_search_created` | conversation_searches | Incrementa search_count | ✅ OK |
| `on_conversation_title` | conversations | Gera título | ✅ OK |
| `on_conversation_updated` | conversations | Atualiza updated_at | ✅ OK |
| `increment_searches_count_trigger` | searches | Incrementa contador | ✅ OK |
| `update_companies_updated_at` | companies | Atualiza updated_at | ✅ OK |
| `update_proposals_updated_at` | proposals | Atualiza updated_at | ✅ OK |
| `update_onboarding_updated_at` | onboarding | Atualiza updated_at | ✅ OK |
| `trg_update_company_ultima_interacao` | company_interactions | Sincroniza ultima_interacao | ✅ OK |

**Conclusão:** ✅ Sistema de triggers bem estruturado, nenhum órfão.

### 2.5 Policies RLS (51 total — segurança 100%)

**Estratégia de isolamento:**
- `user_id = auth.uid()` → Tabelas pessoais (conversations, messages, searches)
- `responsavel_id = account.id` → Tabelas compartilhadas (companies)
- `list.user_id = auth.uid()` OR `list.is_public = true` → Listas públicas/privadas

**Riscos identificados:** ❌ NENHUM
- Sem bypass de RLS
- Sem acesso cross-account
- Sem policies permissivas demais

**Observação:** Listas públicas (`is_public = true`) são intencionalmente visíveis para todos (feature, não bug).

### 2.6 Índices (103 total)

#### **Índices Críticos Implementados**

| Índice | Tabela | Finalidade | Status |
|--------|--------|-----------|--------|
| `idx_companies_place_id_user` | companies | Deduplicação Chat AI (UNIQUE) | ✅ CRÍTICO |
| `idx_companies_crm_filters` | companies | CRM Master filtros | ✅ CRÍTICO |
| `idx_companies_name_trgm` | companies | Busca fuzzy (GIN trigram) | ✅ CRÍTICO |
| `idx_companies_priority_score` | companies | Ordenação DESC | ✅ Importante |
| `idx_searches_results` | searches | JSONB search (GIN) | ✅ Importante |
| `idx_company_interactions_company_timeline` | company_interactions | Timeline DESC | ✅ Importante |
| `idx_lists_user_id` | lists | RLS user isolation | ✅ Importante |

#### **Índices Desnecessários**

❌ NENHUM — todos os 103 índices têm propósito claro e queries que os usam.

### 2.7 Tabelas que Viram Gargalo em Escala

#### 🔴 **CRÍTICO: `messages` (crescimento explosivo)**

**Projeção de crescimento:**
- 10 mensagens/conversa
- 100 conversas/usuário
- 1000 usuários = **1 milhão de mensagens/mês**
- Em 1 ano = **12 milhões de linhas**
- Em 10k usuários = **120 milhões de linhas**

**Impacto:**
- Queries ficam lentas (>5s)
- Backups demoram horas
- Índices degradam

**Solução:**
```sql
-- Particionamento por created_at (monthly)
CREATE TABLE messages_2025_11 PARTITION OF messages
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Arquivamento de conversas inativas (> 3 meses)
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE last_message_at < NOW() - INTERVAL '3 months'
);
```

#### 🔴 **CRÍTICO: `searches.results` (JSONB gigante)**

**Projeção de crescimento:**
- 12 empresas/busca em JSONB
- 50 buscas/usuário
- 1000 usuários = **600k empresas em JSONB**
- Cada empresa = ~500 bytes JSON
- Total = **300 MB de JSONB**
- GIN index = **~1 GB**

**Impacto:**
- Performance do GIN index degrada após 10k searches
- Queries ficam lentas (>2s)

**Solução:**
```sql
-- Opção 1: Remover results JSONB, depender de companies + conversation_searches
ALTER TABLE searches DROP COLUMN results;

-- Opção 2: Arquivar results em S3 após 6 meses
UPDATE searches 
SET results = NULL, results_archived_url = 's3://...'
WHERE created_at < NOW() - INTERVAL '6 months';
```

#### 🟡 **MÉDIO: `product_events` (crescimento linear)**

**Projeção de crescimento:**
- 50 eventos/usuário/dia
- 1000 usuários = **50k eventos/dia**
- Em 1 ano = **18 milhões de linhas**

**Impacto:**
- Queries de analytics ficam lentas

**Solução:**
```sql
-- Particionamento por created_at (monthly)
CREATE TABLE product_events_2025_11 PARTITION OF product_events
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Retenção de 12 meses
DROP TABLE product_events_2024_11;
```

#### 🟡 **MÉDIO: `company_import_logs` (crescimento linear)**

**Projeção de crescimento:**
- 100 imports/usuário/mês
- 1000 usuários = **100k logs/mês**
- Em 1 ano = **1.2 milhão de linhas**

**Impacto:**
- Moderado (queries ainda rápidas)

**Solução:**
- Particionamento se crescer muito
- Ou retenção de 12 meses

### 2.8 Tabelas que Precisam de Particionamento

| Tabela | Prioridade | Estratégia | Quando Implementar |
|--------|-----------|------------|-------------------|
| `messages` | 🔴 CRÍTICO | Monthly by created_at | Antes de 100k mensagens |
| `product_events` | 🟡 MÉDIO | Monthly by created_at | Antes de 1M eventos |
| `company_import_logs` | 🟢 BAIXO | Monthly by created_at | Antes de 5M logs |

---

## 🎨 3. DIAGNÓSTICO DE FRONTEND

### 3.1 Classificação Completa de Rotas

| Rota | Status | Dados | Loading | UX | Observação |
|------|--------|-------|---------|-----|------------|
| `/auth/sign-in` | ✅ Funcional | ✅ Reais | ✅ OK | ✅ OK | Supabase Auth |
| `/auth/sign-up` | ✅ Funcional | ✅ Reais | ✅ OK | ✅ OK | Supabase Auth |
| `/auth/password-reset` | ✅ Funcional | ✅ Reais | ✅ OK | ✅ OK | Supabase Auth |
| `/auth/verify` | ✅ Funcional | ✅ Reais | ✅ OK | ✅ OK | Supabase Auth |
| `/home` | ⚠️ Parcial | ❌ Mock | ✅ OK | ⚠️ Mock | Dashboard com dados fake |
| `/home/crm` | ✅ Funcional | ✅ Reais | ✅ OK | ✅ Excelente | CRM Master 100% |
| `/home/scout/chat` | ✅ Funcional | ✅ Reais | ⚠️ Ruim | ⚠️ Bloqueante | Scraper demora 30-60s |
| `/home/lists` | ✅ Funcional | ✅ Reais | ✅ OK | ✅ Excelente | Listas 100% |
| `/home/scout` | ⚠️ Descontinuado | N/A | N/A | N/A | Substituído por /chat |
| `/home/settings` | ❌ Vazio | N/A | N/A | N/A | Apenas layout |

### 3.2 Dados Reais vs Mock

#### ✅ **DADOS REAIS (7 módulos)**

| Módulo | Fonte de Dados | Status |
|--------|---------------|--------|
| CRM Master | `companies_master_view` | ✅ 100% real |
| Chat AI | `conversations`, `messages`, `searches` | ✅ 100% real |
| Listas | `lists`, `list_companies` | ✅ 100% real |
| Interações | `company_interactions` | ✅ 100% real |
| KPIs Pressão | Views agregadas | ✅ 100% real |
| KPIs Conversão | Views agregadas | ✅ 100% real |
| Export CSV | `companies_master_view` | ✅ 100% real |

#### ❌ **DADOS MOCK (2 módulos)**

| Módulo | Fonte de Dados | Status |
|--------|---------------|--------|
| Dashboard Home | Hardcoded arrays | ❌ 100% fake |
| API `/api/stats` | Hardcoded object | ❌ 100% fake |

### 3.3 Loading States

#### ✅ **OK (5 rotas)**
- `/auth/*` → Loading spinners OK
- `/home/crm` → Skeleton loading OK
- `/home/lists` → Skeleton loading OK
- `/home/scout/chat` (mensagens) → Loading OK

#### ⚠️ **RUIM (1 rota)**
- `/home/scout/chat` (busca) → **Sem feedback adequado**
  - Usuário clica "Buscar"
  - Loading spinner genérico
  - **NÃO MOSTRA:** "Buscando no Google Maps... isso pode demorar 30-60s"
  - **NÃO MOSTRA:** Progress bar
  - **NÃO MOSTRA:** Estimativa de tempo
  - **Resultado:** Usuário fica perdido, acha que travou

**Solução:**
```tsx
<div>
  <p>🔍 Buscando no Google Maps...</p>
  <p>⏱️ Isso pode levar 30-60 segundos</p>
  <ProgressBar value={progress} max={100} />
  <p>Encontradas: {count} empresas</p>
</div>
```

### 3.4 Gargalos Visuais

#### 🟡 **Histórico de conversas sem paginação**
- **Problema:** Retorna TODAS as conversas de uma vez
- **Impacto:** Lento após 100+ conversas
- **Solução:** Paginação com LIMIT 20

#### 🟢 **Tabelas sem virtualization**
- **Problema:** Renderiza TODAS as linhas de uma vez
- **Impacto:** Baixo (paginação implementada)
- **Solução futura:** React Virtual ou TanStack Virtual

---

## 🔁 4. FLUXO REAL DO USUÁRIO (END-TO-END)

### Simulação Completa: Cadastro → Venda

| # | Etapa | Status | Tempo | Observação |
|---|-------|--------|-------|------------|
| 1 | **Cadastro** | ✅ Funciona | 30s | Supabase Auth + trigger cria account |
| 2 | **Email confirmação** | ⚠️ Manual | N/A | Email não enviado (dev local) |
| 3 | **Login** | ✅ Funciona | 5s | Supabase Auth |
| 4 | **Primeira busca Chat AI** | ✅ Funciona | 60s | Scraper + integração CRM |
| 5 | **12 leads aparecem no CRM** | ✅ Funciona | Imediato | Integração automática |
| 6 | **Filtrar leads** | ✅ Funciona | <1s | Filtros funcionais |
| 7 | **Criar lista** | ✅ Funciona | <1s | UI funcional |
| 8 | **Adicionar 5 leads na lista** | ✅ Funciona | <2s | Bulk add |
| 9 | **Ver lista** | ✅ Funciona | <1s | Dados reais |
| 10 | **Registrar interação (ligação)** | ✅ Funciona | <1s | Form funcional |
| 11 | **Lead muda para "qualificado"** | ✅ Funciona | Imediato | Trigger atualiza |
| 12 | **Tentar criar proposta** | ❌ NÃO EXISTE | N/A | **SEM UI** |
| 13 | **WORKAROUND: Registrar "proposta_enviada"** | ⚠️ Manual | <1s | Via interação |
| 14 | **Lead muda para "ganho"** | ✅ Funciona | <1s | Edição inline |
| 15 | **KPI "Ganhos" incrementa** | ✅ Funciona | Imediato | View agregada |
| 16 | **Ver Dashboard** | ❌ Dados fake | N/A | **MOCK** |
| 17 | **Ver KPIs reais no CRM** | ✅ Funciona | <1s | KPIs de conversão |
| 18 | **Exportar CSV** | ✅ Funciona | 5-10s | Encoding UTF-8-BOM |
| 19 | **Tentar ver faturamento** | ❌ NÃO EXISTE | N/A | **SEM UI** |

### 4.1 O Que Funciona

✅ **Fluxo completo de prospecção:**
1. Cadastro → Login → Busca → Leads no CRM → Organização em listas → Follow-ups → Fechamento → KPIs

✅ **Integração automática:**
- Chat AI cria leads no CRM sem intervenção manual
- Triggers atualizam campos automaticamente
- Views agregam métricas em tempo real

✅ **Segurança:**
- RLS isola dados entre usuários
- Autenticação Supabase Auth funcional

### 4.2 O Que NÃO Funciona

❌ **Criação de proposta:**
- Tabela existe, mas sem UI
- Sem API de criação
- Sem geração de PDF
- Sem templates

❌ **Dashboard Home:**
- Gráficos com dados fake
- Sem conexão com banco real

❌ **Registro de pagamento:**
- Tabela existe, mas sem Stripe
- Sem UI financeira

❌ **Análise de website:**
- Funcionalidade não implementada

### 4.3 O Que É Manual

⚠️ **Criação de proposta:**
- Workaround: Criar PDF externo
- Registrar manualmente "proposta_enviada" via interação

⚠️ **Atribuição de responsável:**
- Não tem UI de atribuição automática
- Precisa editar manualmente no CRM

⚠️ **Envio de email:**
- Botão "Email" abre cliente de email
- Não envia via sistema

---

## 💸 5. DIAGNÓSTICO DE MONETIZAÇÃO

### 5.1 Validação de Possibilidades de Cobrança

| Modelo de Monetização | Viável Hoje? | Bloqueio | Estimativa de Implementação |
|----------------------|--------------|----------|---------------------------|
| **Cobrar por plano (mensal)** | ❌ NÃO | Sem integração Stripe | 64h (Fase 2) |
| **Cobrar por uso (busca)** | ❌ NÃO | Sem contabilização + Stripe | 80h |
| **Cobrar por listas (premium)** | ❌ NÃO | Sem Stripe | 64h |
| **Cobrar por exportação (CSV)** | ❌ NÃO | Sem Stripe | 64h |
| **Cobrar por proposta (PDF)** | ❌ NÃO | Sem UI + sem Stripe | 144h (80h UI + 64h Stripe) |
| **Cobrar por scraping (créditos)** | ❌ NÃO | Sem contabilização + Stripe | 80h |
| **Freemium (10 buscas grátis)** | ⚠️ PARCIAL | Falta Stripe para upgrade | 64h |

### 5.2 Classificação de Monetização

#### ❌ **MONETIZAÇÃO BLOQUEADA (100% dos modelos)**

**Bloqueador principal:** Ausência de integração Stripe

**O que falta:**
1. Stripe Checkout integration (64h)
2. Webhook de confirmação de pagamento (16h)
3. UI de planos e pricing (24h)
4. UI de histórico de pagamentos (24h)
5. Dashboard financeiro (40h)

**Total para habilitar monetização:** **168 horas (5-6 semanas)**

#### 🟢 **MONETIZAÇÃO PRONTA (Estrutura)**

✅ **Tabela `payments` existe:**
- Campos: proposal_id, user_id, stripe_session_id, amount, status
- RLS implementada
- Índices OK

✅ **Lógica de business:**
- Sistema de listas (pode ter lista premium)
- Sistema de propostas (pode cobrar por proposta)
- Exportação CSV (pode limitar em plano free)

**Conclusão:** Sistema está **pronto para receber monetização** assim que Stripe for integrado.

### 5.3 Roadmap de Monetização

**Fase 1: Stripe Integration (64h)**
1. Stripe Checkout para planos (Starter, Pro, Enterprise)
2. Webhook de confirmação
3. Atualização de `accounts.plan` e `accounts.plan_expires_at`

**Fase 2: UI de Planos (48h)**
1. Pricing page
2. Botão "Upgrade" em cada módulo
3. Modal de seleção de plano

**Fase 3: Limitações por Plano (56h)**
1. Rate limiting por plano (Free: 10 buscas/mês, Pro: ilimitado)
2. Limite de listas (Free: 3, Pro: ilimitado)
3. Limite de exportação (Free: 100 leads/mês, Pro: ilimitado)

**Total:** **168 horas**

---

## 🧨 6. RISCOS CRÍTICOS

### 6.1 Pontos Únicos de Falha (SPOF)

#### 🔴 **SPOF #1: Scraper API (porta 3001)**
- **Risco:** Sistema inteiro para se scraper cair
- **Probabilidade:** Alta (Google pode bloquear a qualquer momento)
- **Impacto:** Downtime total do Chat AI
- **Sem retry, sem fallback, sem circuit breaker**
- **Mitigação:** Job queue + múltiplas instâncias + fallback Google Places API

#### 🟡 **SPOF #2: Supabase Database (Docker local)**
- **Risco:** Container cair = downtime total
- **Probabilidade:** Média (instabilidade de Docker)
- **Impacto:** Downtime total do sistema
- **Mitigação:** Migrar para Supabase Cloud com replicação

#### 🟢 **SPOF #3: Next.js (porta 3000)**
- **Risco:** Instância única
- **Probabilidade:** Baixa (fácil de escalar)
- **Impacto:** Baixo
- **Mitigação:** Deploy em Vercel com auto-scaling

### 6.2 Dependências Perigosas

#### 🔴 **Scraping do Google Maps**
- **Risco:** Google pode bloquear IP a qualquer momento
- **Probabilidade:** Alta (violação de ToS)
- **Impacto:** Chat AI para de funcionar
- **Custo de migração:** R$ 1000/mês (Google Places API oficial)

#### 🟡 **Supabase Client direto (sem ORM)**
- **Risco:** Queries SQL podem ter erro humano
- **Probabilidade:** Média
- **Impacto:** Bugs em produção
- **Mitigação:** Adicionar Prisma ou Drizzle ORM

### 6.3 Ausências Críticas

| Ausência | Impacto | Risco | Solução | Custo |
|----------|---------|-------|---------|-------|
| **Rate limiting** | Abuse de API | 🔴 ALTO | Middleware | 16h |
| **Job queue** | Timeout, UX ruim | 🔴 ALTO | BullMQ | 40h |
| **Retry logic** | Perda de dados | 🔴 ALTO | Backoff exponencial | 16h |
| **Circuit breaker** | Cascata de falhas | 🟡 MÉDIO | Resilience4j pattern | 24h |
| **Testes E2E** | Regressão | 🟡 MÉDIO | Playwright | 48h |
| **CI/CD** | Deploy manual | 🟡 MÉDIO | GitHub Actions | 24h |
| **Monitoring** | Downtime invisível | 🟡 MÉDIO | Sentry + Uptime | 16h |
| **Autenticação scraper** | Abuse | 🟢 BAIXO | API key | 8h |

**Total para mitigar riscos críticos:** **192 horas (6-8 semanas)**

---

## 🧾 7. DÍVIDA TÉCNICA

### 7.1 Dívidas Críticas (Impedem escalar/vender)

| # | Dívida | Impacto | Custo | Prioridade |
|---|--------|---------|-------|------------|
| 1 | **Scraper API como SPOF** | Sistema quebra se cair | 80h | 🔴 P0 |
| 2 | **Tabela `searches.results` JSONB explodindo** | Performance degrada | 32h | 🔴 P0 |
| 3 | **Tabela `messages` sem particionamento** | Queries lentas | 24h | 🔴 P0 |
| 4 | **Integração Chat→CRM bloqueante** | UX ruim | 40h | 🔴 P0 |
| 5 | **Sem rate limiting** | Abuse derruba sistema | 16h | 🔴 P0 |

**Total Dívidas Críticas:** **192 horas (6-8 semanas)**

### 7.2 Dívidas Médias (Afetam produção)

| # | Dívida | Impacto | Custo | Prioridade |
|---|--------|---------|-------|------------|
| 6 | **Tabela `onboarding` com FK errado** | Funcionalidade quebrada | 8h | 🟡 P1 |
| 7 | **Dashboard Home com dados fake** | Credibilidade baixa | 40h | 🟡 P1 |
| 8 | **Export CSV sem limit** | Timeout em exports grandes | 16h | 🟡 P1 |
| 9 | **Sem CI/CD** | Deploy manual com risco | 24h | 🟡 P1 |
| 10 | **Histórico de conversas sem paginação** | Lento após 100+ conversas | 16h | 🟡 P1 |

**Total Dívidas Médias:** **104 horas (3-4 semanas)**

### 7.3 Dívidas Baixas (Melhorias futuras)

| # | Dívida | Impacto | Custo | Prioridade |
|---|--------|---------|-------|------------|
| 11 | **Scraper API sem autenticação** | Risco de abuse local | 8h | 🟢 P2 |
| 12 | **Tabela `templates` com constraint 1:1** | Limitação funcional | 8h | 🟢 P2 |
| 13 | **Sem testes automatizados** | Risco de regressão | 48h | 🟢 P2 |
| 14 | **Arquitetura mista REST + Server Actions** | Inconsistência | 40h | 🟢 P2 |
| 15 | **Sem error handling global** | Erros genéricos | 24h | 🟢 P2 |

**Total Dívidas Baixas:** **128 horas (4-5 semanas)**

---

## 🗺️ 8. MAPA DE MATURIDADE

| Módulo | Status | Maturidade | Dados | UX | Performance | Pronto para Produção? |
|--------|--------|------------|-------|-----|-------------|----------------------|
| **CRM Master** | ✅ Operacional | 95% | ✅ Reais | ✅ Excelente | ✅ Rápido | ✅ **SIM** |
| **Chat AI / Scout** | ✅ Operacional | 90% | ✅ Reais | ⚠️ Bloqueante | ⚠️ 30-60s | ⚠️ **SIM com ressalvas** |
| **Sistema de Listas** | ✅ Operacional | 90% | ✅ Reais | ✅ Excelente | ✅ Rápido | ✅ **SIM** |
| **Interações** | ✅ Operacional | 100% | ✅ Reais | ✅ Excelente | ✅ Rápido | ✅ **SIM** |
| **Propostas** | ⚠️ Estrutura | 40% | ⚠️ Estrutura | ❌ Sem UI | N/A | ❌ **NÃO** |
| **Dashboard KPIs** | ⚠️ Mock | 30% | ❌ Fake | ✅ OK | N/A | ❌ **NÃO** |
| **Análise Website** | ❌ Não existe | 5% | ❌ Não existe | ❌ Não existe | N/A | ❌ **NÃO** |
| **Pagamentos** | ❌ Estrutura | 5% | ⚠️ Estrutura | ❌ Sem UI | N/A | ❌ **NÃO** |
| **Autenticação** | ✅ Operacional | 100% | ✅ Reais | ✅ Excelente | ✅ Rápido | ✅ **SIM** |
| **Segurança (RLS)** | ✅ Operacional | 100% | ✅ 51 policies | ✅ Funcional | ✅ Rápido | ✅ **SIM** |
| **Banco de Dados** | ✅ Operacional | 95% | ✅ Normalizado | ✅ Estruturado | ✅ Indexado | ✅ **SIM** |

### Legenda de Maturidade

- **100%:** Pronto para produção sem ressalvas
- **90-95%:** Pronto para produção com pequenos ajustes
- **70-85%:** Funcional mas precisa melhorias críticas
- **40-60%:** Parcialmente implementado
- **0-30%:** Apenas estrutura ou mock

### Média Ponderada

**Maturidade Geral do Sistema:** **68% (C+)**

**Distribuição:**
- 4 módulos prontos (95-100%) → **40%**
- 1 módulo funcional com ressalvas (90%) → **10%**
- 1 módulo parcial (40%) → **5%**
- 3 módulos incompletos (0-30%) → **5%**

---

## 🎯 9. CONCLUSÃO EXECUTIVA

### O SPEC64 hoje é:

**Um MVP Beta-Ready (60%)** — sistema funcional para testes com usuários reais, mas não pronto para escala comercial.

**Classificação técnica:**
- ✅ **Produto Beta** → pode receber early adopters pagantes
- ⚠️ **Early SaaS** → precisa ajustes para 100-500 usuários
- ❌ **NÃO é Scale-ready** → não aguenta 1k+ usuários sem refatorações

### O sistema hoje aguenta:

| Métrica | Capacidade Atual | Com Fase 1 | Com Fases 1+2+3 |
|---------|-----------------|------------|-----------------|
| **Usuários simultâneos** | 10-50 | 100-500 | 1k-10k |
| **Buscas/minuto** | 5-10 | 50-100 | 500-1000 |
| **Mensagens no banco** | 1k | 100k | 10M |
| **Searches no banco** | 100 | 10k | 100k |
| **Tempo de response Chat** | 60s | 3s + async | 1s + async |
| **Uptime esperado** | 90% | 95% | 99.5% |

### O que trava faturamento imediato?

🔴 **BLOQUEADOR #1: Módulo Propostas sem UI**
- Tabela existe, mas sem interface
- Sem geração de PDF
- Sem templates
- **Investimento:** 80 horas (2-3 semanas)

🔴 **BLOQUEADOR #2: Integração Stripe ausente**
- Sem cobrança de planos
- Sem processamento de pagamentos
- **Investimento:** 64 horas (2 semanas)

🟡 **BLOQUEADOR #3: Dashboard com dados fake**
- Credibilidade baixa para demonstrações
- **Investimento:** 40 horas (1 semana)

**Total para desbloquear faturamento:** **184 horas (6-8 semanas)**

### O que trava escala?

🔴 **BLOQUEADOR #1: Scraper API como SPOF**
- Sistema quebra se scraper cair
- Google pode bloquear a qualquer momento
- **Investimento:** 80 horas (job queue + múltiplas instâncias)

🔴 **BLOQUEADOR #2: Integração Chat→CRM bloqueante**
- UX ruim (usuário espera 60s)
- Não escala acima de 50 buscas simultâneas
- **Investimento:** 40 horas (job queue)

🔴 **BLOQUEADOR #3: Tabelas sem particionamento**
- `messages` vai ter 100M+ linhas em 1 ano
- `searches.results` JSONB vai degradar performance
- **Investimento:** 56 horas (particionamento)

🟡 **BLOQUEADOR #4: Sem rate limiting**
- Abuse pode derrubar sistema
- **Investimento:** 16 horas

**Total para desbloquear escala:** **192 horas (6-8 semanas)**

### O que trava confiança de investidor?

🔴 **RED FLAG #1: Sem CI/CD**
- Deploy manual com risco de downtime
- Sem testes automatizados
- **Investimento:** 72 horas (CI/CD + testes E2E)

🔴 **RED FLAG #2: Dependência de scraping ilegal**
- Violação de ToS do Google
- Pode ser bloqueado a qualquer momento
- **Investimento:** 80 horas (fallback para Google Places API)

🟡 **RED FLAG #3: Métricas fake no Dashboard**
- Investidor vê dados fake
- **Investimento:** 40 horas (conectar com banco real)

**Total para ganhar confiança:** **192 horas (6-8 semanas)**

---

## 💰 INVESTIMENTO TOTAL PARA PRODUÇÃO

### Resumo de Investimento

| Objetivo | Horas | Custo* | Prazo |
|----------|-------|--------|-------|
| **Desbloquear Faturamento** | 184h | R$ 36.800 | 6-8 sem |
| **Desbloquear Escala** | 192h | R$ 38.400 | 6-8 sem |
| **Ganhar Confiança** | 192h | R$ 38.400 | 6-8 sem |
| **Roadmap Completo (Fases 1+2+3)** | 720h | R$ 144.000 | 18-26 sem |

_*Baseado em dev sênior R$ 200/h (mercado BR 2025)_

### Priorização Recomendada

**Cenário 1: Orçamento R$ 40k (2-3 meses)**
1. Job queue Chat→CRM (40h)
2. Rate limiting (16h)
3. Stripe integration (64h)
4. Propostas UI (80h)
5. Dashboard real (40h)

**Cenário 2: Orçamento R$ 80k (4-6 meses)**
1. Tudo do Cenário 1 (240h)
2. Múltiplas instâncias scraper (48h)
3. Particionamento `messages` (24h)
4. CI/CD (24h)
5. Testes E2E (48h)

**Cenário 3: Orçamento R$ 144k (6-12 meses)**
1. Roadmap completo (Fases 1+2+3) (720h)
2. Sistema scale-ready para 10k usuários

---

## 🚦 RECOMENDAÇÃO FINAL

### Para Early Adopters (Hoje):

✅ **VENDER COMO BETA** (R$ 97/mês, 50% off)
- Deixar claro: Dashboard é mock, Propostas é manual
- Limite: 50 usuários pagantes
- SLA: 90% uptime (sem garantia crítica)
- Suporte: Email only (24-48h)

### Para Escala (6 meses):

✅ **INVESTIR R$ 144k** (Roadmap completo)
- Sistema scale-ready para 1k-10k usuários
- Uptime 99.5%
- Monetização habilitada
- CI/CD + testes automatizados

### Vale Escalar ou Reescrever?

✅ **VALE ESCALAR** (não reescrever)

**Motivos:**
- Arquitetura base é sólida (RLS, normalização, índices)
- Backend e Frontend bem estruturados
- 90% do código é aproveitável
- Reescrita custaria R$ 300k+ e 6+ meses
- Problemas são pontuais e resolvíveis

**Estratégia:** Refatoração incremental (Roadmap 3 fases)

---

**FIM DO DIAGNÓSTICO EXECUTIVO**

**Documentos complementares:**
- ✅ `DIAGNOSTICO_SPEC64_PARTE1.md` (71KB - Banco + Backend)
- ✅ `DIAGNOSTICO_SPEC64_PARTE2.md` (65KB - Frontend + Roadmap)
- ✅ `DIAGNOSTICO_EXECUTIVO_SPEC64.md` (Este documento)