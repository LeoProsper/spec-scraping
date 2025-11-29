# 🧠 ADMIN AI CONTROL - Central de Controle da IA

**Sistema:** SPEC64  
**Versão:** 1.0  
**Data:** 29/11/2025  

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Como Configurar OpenAI](#como-configurar-openai)
4. [Como Ativar/Desativar Módulos](#como-ativardesativar-módulos)
5. [Como Monitorar Uso](#como-monitorar-uso)
6. [Como Agir em Caso de Estouro de Custo](#como-agir-em-caso-de-estouro-de-custo)
7. [APIs Admin](#apis-admin)
8. [Tabelas do Banco](#tabelas-do-banco)
9. [Segurança](#segurança)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

O **Admin AI Control** permite que administradores controlem totalmente a camada de IA do SPEC64:

✅ **Configurar OpenAI** - API key, models, limites  
✅ **Ativar/Desativar Módulos** - Controle onde a IA atua  
✅ **Monitorar Consumo** - Custo, tokens, usuários top  
✅ **Definir Limites** - Rate limits, bloqueios, emergência  

**Hierarquia de Configuração:**
```
1. Banco de dados (ai_settings) ← PREFERENCIAL
2. .env (fallback emergencial)
3. Error (bloqueia IA se ambos falharem)
```

---

## 🏗️ ARQUITETURA

### Fluxo de Execução

```
┌─────────────────┐
│  runAI()        │
│  (service)      │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│ 1. Verifica feature_flag    │
│    - Módulo ativo?          │
│    - Max calls OK?          │
└─────────┬───────────────────┘
          │
          ↓
┌─────────────────────────────┐
│ 2. Busca config             │
│    - ai_settings (DB)       │
│    - .env (fallback)        │
└─────────┬───────────────────┘
          │
          ↓
┌─────────────────────────────┐
│ 3. Chama OpenAI             │
│    - Retry 3x               │
│    - Timeout 45s            │
└─────────┬───────────────────┘
          │
          ↓
┌─────────────────────────────┐
│ 4. Calcula custo            │
│    - Input tokens * $0.15   │
│    - Output tokens * $0.60  │
└─────────┬───────────────────┘
          │
          ↓
┌─────────────────────────────┐
│ 5. Salva log (ai_usage_logs)│
│    - Tokens, custo, metadata│
└─────────────────────────────┘
```

---

## ⚙️ COMO CONFIGURAR OPENAI

### Opção 1: Via UI Admin (RECOMENDADO)

1. Acesse `/home/admin/ai`
2. Clique na aba **"Conexão OpenAI"**
3. Preencha:
   - **API Key**: `sk-proj-...` (obtida em [platform.openai.com](https://platform.openai.com))
   - **Model Default**: `gpt-4o-mini` (rápido e barato)
   - **Model High**: `gpt-4o` (alta qualidade)
   - **Max Tokens**: `1200`
   - **Timeout**: `45000` (45 segundos)
   - **Temperature**: `0.6`
4. Clique em **"Salvar Configuração"**

### Opção 2: Via SQL (Emergencial)

```sql
insert into ai_settings (
  provider,
  api_key,
  api_base_url,
  model_default,
  model_high,
  max_tokens,
  timeout_ms,
  temperature_default,
  is_active
) values (
  'openai',
  'sk-proj-SEU_KEY_AQUI',
  'https://api.openai.com/v1',
  'gpt-4o-mini',
  'gpt-4o',
  1200,
  45000,
  0.6,
  true
);
```

### Opção 3: Via .env (Fallback)

Apenas para desenvolvimento/emergência:

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL_DEFAULT=gpt-4o-mini
OPENAI_MODEL_HIGH=gpt-4o
OPENAI_MAX_TOKENS=1200
OPENAI_TIMEOUT_MS=45000
```

⚠️ **Importante:** Em produção, sempre use o banco de dados (Opção 1).

---

## 🧩 COMO ATIVAR/DESATIVAR MÓDULOS

### Via UI Admin

1. Acesse `/home/admin/ai`
2. Clique na aba **"Módulos IA"**
3. Use os switches para ativar/desativar:
   - ✅ **CHAT_AI** - Chat principal
   - ✅ **B2B_GENERATOR** - Gerador de oportunidades
   - ✅ **CRM_ASSISTANT** - IA no CRM
   - ✅ **PROPOSAL_WRITER** - IA para propostas
   - ✅ **EMAIL_OUTREACH** - IA para emails
   - ✅ **CLASSIFICATION** - Classificação automática

### Via SQL

```sql
-- Desligar Chat AI
update ai_feature_flags 
set is_enabled = false 
where feature = 'CHAT_AI';

-- Religar Chat AI
update ai_feature_flags 
set is_enabled = true 
where feature = 'CHAT_AI';

-- EMERGÊNCIA: Desligar TODA a IA do sistema
update ai_feature_flags 
set is_enabled = false;
```

---

## 📊 COMO MONITORAR USO

### Via UI Admin

1. Acesse `/home/admin/ai`
2. Clique na aba **"Analytics"**
3. Veja:
   - **Total de Chamadas**
   - **Custo Total (USD)**
   - **Taxa de Sucesso**
   - **Por Módulo** (ranking por custo)
   - **Top Usuários** (quem mais usa IA)

### Via SQL

**Custo mensal:**
```sql
select
  mode,
  count(*) as calls,
  sum(cost_estimated) as total_cost,
  sum(total_tokens) as total_tokens
from ai_usage_logs
where created_at >= now() - interval '30 days'
  and success = true
group by mode
order by total_cost desc;
```

**Top 10 usuários por custo:**
```sql
select
  user_id,
  count(*) as calls,
  sum(cost_estimated) as total_cost
from ai_usage_logs
where created_at >= now() - interval '30 days'
  and success = true
group by user_id
order by total_cost desc
limit 10;
```

**Custo diário (últimos 7 dias):**
```sql
select
  date_trunc('day', created_at)::date as day,
  count(*) as calls,
  sum(cost_estimated) as cost
from ai_usage_logs
where created_at >= now() - interval '7 days'
  and success = true
group by day
order by day desc;
```

---

## 🚨 COMO AGIR EM CASO DE ESTOURO DE CUSTO

### Cenário 1: Usuário Abusando

```sql
-- 1. Identificar usuário
select
  user_id,
  count(*) as calls_last_hour
from ai_usage_logs
where created_at >= now() - interval '1 hour'
group by user_id
order by calls_last_hour desc
limit 1;

-- 2. Ver detalhes
select * from ai_usage_logs
where user_id = 'USER_ID_AQUI'
  and created_at >= now() - interval '1 hour'
order by created_at desc;

-- 3. Temporariamente desligar IA para esse usuário
-- (implementar em versão futura)
```

### Cenário 2: Módulo Consumindo Muito

```sql
-- 1. Identificar módulo
select
  mode,
  sum(cost_estimated) as total_cost
from ai_usage_logs
where created_at >= now() - interval '24 hours'
group by mode
order by total_cost desc;

-- 2. Desligar módulo temporariamente
update ai_feature_flags 
set is_enabled = false 
where feature = 'MODO_AQUI';
```

### Cenário 3: EMERGÊNCIA TOTAL

```sql
-- DESLIGAR TODA A IA DO SISTEMA
update ai_feature_flags set is_enabled = false;

-- Ou via UI: Vá em /home/admin/ai → Módulos IA → Desligue tudo
```

### Cenário 4: Definir Alertas (Recomendado)

1. **OpenAI Dashboard:**
   - Acesse [platform.openai.com/usage](https://platform.openai.com/usage)
   - Configure **Spending Limits** (ex: $50/mês)
   - Configure **Email Alerts** (ex: alerta aos $40)

2. **Monitoramento SPEC64:**
   ```sql
   -- Query para rodar 1x por dia
   select sum(cost_estimated) as custo_ultimas_24h
   from ai_usage_logs
   where created_at >= now() - interval '24 hours';
   
   -- Se custo > $10/dia → enviar alerta
   ```

---

## 🔌 APIS ADMIN

Todas as rotas requerem `role = 'admin'`.

### 1. GET /api/admin/ai/settings

Retorna configuração atual (API key mascarada).

**Response:**
```json
{
  "success": true,
  "config": {
    "provider": "openai",
    "api_key_masked": "sk-****abc3",
    "model_default": "gpt-4o-mini",
    "max_tokens": 1200,
    "timeout_ms": 45000,
    "temperature_default": 0.6
  }
}
```

### 2. POST /api/admin/ai/settings

Salva nova configuração.

**Body:**
```json
{
  "api_key": "sk-proj-...",
  "model_default": "gpt-4o-mini",
  "model_high": "gpt-4o",
  "max_tokens": 1200,
  "timeout_ms": 45000,
  "temperature_default": 0.6
}
```

### 3. GET /api/admin/ai/flags

Lista todas as feature flags.

**Response:**
```json
{
  "success": true,
  "flags": [
    {
      "feature": "CHAT_AI",
      "is_enabled": true,
      "description": "Chat principal do sistema"
    }
  ]
}
```

### 4. POST /api/admin/ai/flags

Atualiza uma feature flag.

**Body:**
```json
{
  "feature": "CHAT_AI",
  "is_enabled": false
}
```

### 5. GET /api/admin/ai/usage

Retorna analytics de uso.

**Query Params:**
- `period`: `day | week | month | all`
- `mode`: `CHAT_AI | B2B_GENERATOR | ...`
- `userId`: `uuid`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRequests": 1234,
    "totalCost": 2.5678,
    "successRate": "98.5",
    "byMode": [...],
    "topUsers": [...]
  }
}
```

---

## 🗄️ TABELAS DO BANCO

### ai_settings

Configurações da OpenAI.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| provider | text | 'openai' \| 'anthropic' \| ... |
| api_key | text | API key (NUNCA exposta ao frontend) |
| api_base_url | text | URL base da API |
| model_default | text | Modelo padrão (ex: gpt-4o-mini) |
| model_high | text | Modelo high-quality (ex: gpt-4o) |
| max_tokens | integer | Máximo de tokens por resposta |
| timeout_ms | integer | Timeout em milissegundos |
| temperature_default | numeric | Temperature padrão (0-2) |
| is_active | boolean | Apenas 1 config ativa por vez |

### ai_feature_flags

Controle de onde a IA atua.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| feature | text | Nome do módulo (CHAT_AI, B2B_GENERATOR, etc) |
| is_enabled | boolean | Módulo ativo? |
| description | text | Descrição do módulo |
| max_calls_per_user_per_day | integer | Limite por usuário/dia (null = ilimitado) |
| max_calls_per_minute | integer | Limite global/minuto (null = ilimitado) |

### ai_usage_logs

Logs detalhados de uso.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| user_id | uuid | Usuário que fez a chamada |
| mode | text | Modo usado (CHAT, B2B_GENERATOR, etc) |
| input_tokens | integer | Tokens de entrada |
| output_tokens | integer | Tokens de saída |
| total_tokens | integer | Total (computed) |
| cost_estimated | numeric | Custo em USD |
| model_used | text | Modelo usado na chamada |
| duration_ms | integer | Duração em milissegundos |
| success | boolean | Sucesso ou falha |
| error_code | text | Código de erro (se falha) |
| error_message | text | Mensagem de erro |
| metadata | jsonb | Metadados adicionais |

---

## 🔒 SEGURANÇA

### Níveis de Proteção

1. **RLS (Row Level Security)**
   - Apenas admins veem `ai_settings`
   - Apenas admins editam `ai_feature_flags`
   - Usuários veem apenas seus próprios logs

2. **API Key NUNCA vai para o frontend**
   - GET retorna `api_key_masked: "sk-****abc3"`
   - POST aceita `api_key` mas nunca retorna

3. **Middleware requireAdmin()**
   - Todas as rotas `/api/admin/ai/*` verificam `role = 'admin'`
   - 401 se não autenticado
   - 403 se não é admin

4. **Function Security DEFINER**
   - `get_active_ai_config()` não expõe API key
   - `mask_api_key()` sempre mascara chaves

### Checklist de Segurança

- [ ] API key da OpenAI está em `ai_settings` (não em .env)
- [ ] Usuário `lelevitormkt@gmail.com` tem `role = 'admin'`
- [ ] Spending Limit configurado no OpenAI Dashboard
- [ ] Email alerts configurados para $40/mês
- [ ] Apenas admins acessam `/home/admin/ai`

---

## 🔧 TROUBLESHOOTING

### Erro: "AI is not configured"

**Causa:** Não há config ativa no banco e .env não tem `OPENAI_API_KEY`.

**Solução:**
1. Acesse `/home/admin/ai`
2. Configure OpenAI pela primeira vez
3. Ou adicione `OPENAI_API_KEY` no `.env.local`

### Erro: "AI feature is disabled"

**Causa:** Módulo está desligado em `ai_feature_flags`.

**Solução:**
1. Acesse `/home/admin/ai` → Módulos IA
2. Ative o módulo desejado

### Erro: "Invalid OpenAI API key"

**Causa:** API key inválida ou expirada.

**Solução:**
1. Gere nova API key em [platform.openai.com](https://platform.openai.com/api-keys)
2. Atualize em `/home/admin/ai` → Conexão OpenAI

### Custo muito alto

**Solução:**
1. Acesse `/home/admin/ai` → Analytics
2. Identifique módulo ou usuário abusando
3. Desligue módulo temporariamente
4. Configure `max_calls_per_user_per_day` nas flags

### IA muito lenta

**Solução:**
1. Verifique `timeout_ms` (recomendado: 45000)
2. Use `gpt-4o-mini` ao invés de `gpt-4o`
3. Reduza `max_tokens` de 1200 para 800

---

## 📚 REFERÊNCIAS

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**FIM DA DOCUMENTAÇÃO**
