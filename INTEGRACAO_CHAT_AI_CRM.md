# 🔗 INTEGRAÇÃO OBRIGATÓRIA: CHAT AI → CRM MASTER

**Data:** 29/11/2025  
**Objetivo:** Toda empresa encontrada via Chat AI deve automaticamente virar um LEAD OPERACIONAL no CRM do usuário.

---

## 📊 FASE 1 — DIAGRAMA DO FLUXO ATUAL

### 🔴 FLUXO ANTES DA INTEGRAÇÃO (QUEBRADO)

```
┌─────────────────────┐
│  Chat AI (Scout)    │
│  - Usuário busca    │
│  - Resultado vem    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API /api/scout/     │
│     search          │
│ - Chama searchPlaces│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Salva em:           │
│ ✅ searches         │
│ ❌ companies (NÃO!) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ❌ QUEBRA AQUI      │
│                     │
│ Leads NÃO aparecem: │
│ - CRM Master        │
│ - KPIs Dashboard    │
│ - Listas            │
│ - Exportação        │
│ - Propostas         │
└─────────────────────┘
```

### 🟢 FLUXO DEPOIS DA INTEGRAÇÃO (CORRETO)

```
┌─────────────────────┐
│  Chat AI (Scout)    │
│  - Usuário busca    │
│  - Resultado vem    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API /api/scout/     │
│     search          │
│ - Chama searchPlaces│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Salva em:                                │
│ ✅ searches (histórico)                  │
│ ✅ companies (CRM)                       │
│    └─ NOVO: create_or_update_company_   │
│              from_chat()                 │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ ✅ INTEGRAÇÃO COMPLETA                   │
│                                          │
│ Leads automaticamente em:                │
│ ✅ CRM Master (com lead_status)          │
│ ✅ KPIs Dashboard (atualiza métricas)    │
│ ✅ Listas (via lista automática)         │
│ ✅ Exportação (CSV disponível)           │
│ ✅ Propostas (pode criar)                │
│ ✅ Scoring automático (trigger)          │
│ ✅ Telemetria (product_events)           │
└─────────────────────────────────────────┘
```

---

## 🔍 FASE 1 — PONTOS DE QUEBRA IDENTIFICADOS

### 📌 Onde o Chat AI salva dados atualmente

**Tabela:** `searches`  
**Campos salvos:**
- `user_id` ✅
- `title` ✅
- `query` ✅
- `max_places` ✅
- `radius` ✅
- `lang` ✅
- `total_results` ✅
- `status` ✅
- `results` (JSONB com dados completos) ✅

**Problema:** Os dados ficam apenas em `searches.results` (JSONB). Não são inseridos em `companies`.

---

### 📌 Campos NÃO preenchidos no CRM (companies)

Quando uma empresa é encontrada via Chat AI, os seguintes campos NÃO são criados:

| Campo | Status Atual | Valor Esperado |
|-------|--------------|----------------|
| `id` | ❌ Não existe | UUID gerado |
| `account_id` | ❌ Não existe | account_id do usuário |
| `place_id` | ❌ Não existe | place_id do Google Maps |
| `name` | ❌ Não existe | Nome da empresa |
| `municipio` | ❌ Não existe | Cidade extraída do address |
| `state` | ❌ Não existe | Estado extraído do address |
| `category` | ❌ Não existe | categories[0] |
| `phone` | ❌ Não existe | phone |
| `website` | ❌ Não existe | website |
| `rating` | ❌ Não existe | rating |
| `reviews_count` | ❌ Não existe | reviews_count |
| `latitude` | ❌ Não existe | coordinates.latitude |
| `longitude` | ❌ Não existe | coordinates.longitude |
| **`lead_status`** | ❌ **NÃO PREENCHIDO** | **'novo'** |
| **`responsavel_id`** | ❌ **NÃO PREENCHIDO** | **user_id** |
| **`origem`** | ❌ **CAMPO NÃO EXISTE** | **'chat_ai'** |
| **`ultima_interacao`** | ❌ **NÃO PREENCHIDO** | **NOW()** |
| `lead_score` | ⚠️ Será calculado | trigger automático |
| `prioridade` | ⚠️ Será calculado | trigger automático |

---

## 🛠️ FASE 2 — FUNÇÃO UNIFICADA DE INSERÇÃO

### 📝 Função SQL: `create_or_update_company_from_chat()`

```sql
CREATE OR REPLACE FUNCTION public.create_or_update_company_from_chat(
  p_user_id UUID,
  p_place_id TEXT,
  p_name TEXT,
  p_address TEXT,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_rating DECIMAL(2,1) DEFAULT NULL,
  p_reviews_count INTEGER DEFAULT NULL,
  p_latitude DECIMAL(10,8) DEFAULT NULL,
  p_longitude DECIMAL(11,8) DEFAULT NULL,
  p_google_maps_link TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_about TEXT DEFAULT NULL,
  p_opening_hours TEXT DEFAULT NULL
)
RETURNS TABLE(
  company_id UUID,
  action TEXT,
  message TEXT
) AS $$
DECLARE
  v_company_id UUID;
  v_account_id UUID;
  v_existing_company UUID;
  v_action TEXT;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- 1) Buscar account_id do usuário
  SELECT id INTO v_account_id 
  FROM public.accounts 
  WHERE primary_owner_user_id = p_user_id 
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Usuário % não possui account associado', p_user_id;
  END IF;

  -- 2) Verificar se empresa já existe por place_id
  SELECT id INTO v_existing_company 
  FROM public.companies 
  WHERE place_id = p_place_id 
    AND account_id = v_account_id
  LIMIT 1;

  IF v_existing_company IS NOT NULL THEN
    -- 3a) EMPRESA JÁ EXISTE - Atualizar ultima_interacao
    UPDATE public.companies
    SET 
      ultima_interacao = v_now,
      updated_at = v_now
    WHERE id = v_existing_company;

    v_company_id := v_existing_company;
    v_action := 'updated';

    -- Registrar telemetria de atualização
    INSERT INTO public.product_events (user_id, evento, company_id, metadata)
    VALUES (
      p_user_id,
      'lead_atualizado_via_chat',
      v_company_id,
      jsonb_build_object(
        'place_id', p_place_id,
        'name', p_name
      )
    );

    -- Log de auditoria
    INSERT INTO public.company_import_logs (
      user_id, 
      company_id, 
      source, 
      action, 
      place_id,
      created_at
    )
    VALUES (
      p_user_id, 
      v_company_id, 
      'chat_ai', 
      'updated',
      p_place_id,
      v_now
    );

  ELSE
    -- 3b) EMPRESA NÃO EXISTE - Criar nova
    INSERT INTO public.companies (
      account_id,
      place_id,
      name,
      address,
      municipio,
      state,
      category,
      phone,
      website,
      rating,
      reviews_count,
      latitude,
      longitude,
      google_maps_link,
      cnpj,
      about,
      opening_hours,
      lead_status,
      responsavel_id,
      origem,
      ultima_interacao,
      data_primeiro_contato,
      created_at,
      updated_at
    )
    VALUES (
      v_account_id,
      p_place_id,
      p_name,
      p_address,
      COALESCE(p_city, split_part(p_address, ',', -2)),  -- Extrair cidade
      COALESCE(p_state, split_part(p_address, ',', -1)), -- Extrair estado
      p_category,
      p_phone,
      p_website,
      p_rating,
      p_reviews_count,
      p_latitude,
      p_longitude,
      p_google_maps_link,
      p_cnpj,
      p_about,
      p_opening_hours,
      'novo',           -- ✅ lead_status
      p_user_id,        -- ✅ responsavel_id
      'chat_ai',        -- ✅ origem
      v_now,            -- ✅ ultima_interacao
      v_now,            -- data_primeiro_contato
      v_now,
      v_now
    )
    RETURNING id INTO v_company_id;

    v_action := 'created';

    -- Registrar telemetria de criação
    INSERT INTO public.product_events (user_id, evento, company_id, metadata)
    VALUES (
      p_user_id,
      'lead_criado_via_chat',
      v_company_id,
      jsonb_build_object(
        'place_id', p_place_id,
        'name', p_name,
        'city', COALESCE(p_city, split_part(p_address, ',', -2)),
        'category', p_category,
        'has_phone', p_phone IS NOT NULL,
        'has_website', p_website IS NOT NULL,
        'has_rating', p_rating IS NOT NULL,
        'rating', p_rating,
        'reviews_count', p_reviews_count
      )
    );

    -- Log de auditoria
    INSERT INTO public.company_import_logs (
      user_id, 
      company_id, 
      source, 
      action,
      place_id,
      created_at
    )
    VALUES (
      p_user_id, 
      v_company_id, 
      'chat_ai', 
      'created',
      p_place_id,
      v_now
    );

    -- Atualizar progresso de onboarding
    UPDATE public.accounts
    SET onboarding_progress = jsonb_set(
      COALESCE(onboarding_progress, '{}'::jsonb),
      '{first_lead_created}',
      'true'::jsonb
    )
    WHERE id = v_account_id;
  END IF;

  -- 4) Retornar resultado
  RETURN QUERY SELECT 
    v_company_id,
    v_action,
    CASE 
      WHEN v_action = 'created' THEN 'Lead criado com sucesso no CRM!'
      ELSE 'Lead já existe. Última interação atualizada.'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_or_update_company_from_chat TO authenticated;

COMMENT ON FUNCTION public.create_or_update_company_from_chat IS 
'INTEGRAÇÃO CHAT AI → CRM MASTER
Cria ou atualiza empresa no CRM a partir de busca do Chat AI.
Campos preenchidos obrigatoriamente:
- lead_status = novo
- responsavel_id = user_id
- origem = chat_ai
- ultima_interacao = NOW()
- Telemetria automática
- Log de auditoria
- Proteção contra duplicação por place_id';
```

---

## 🔄 FASE 3 — REFLEXO AUTOMÁTICO NO CRM

### ✅ Garantias após integração

1. **Leads aparecem no CRM Master imediatamente**
   - Após busca via Chat AI
   - Com status `lead_status = 'novo'`
   - Atribuídos automaticamente ao usuário (`responsavel_id`)

2. **KPIs são atualizados automaticamente**
   - Leads ativos +1
   - Leads novos +1
   - Se rating ≥ 4.5 e reviews ≥ 50 → Hot leads +1

3. **Disponíveis para operações CRM**
   - ✅ Adicionar em listas
   - ✅ Criar propostas
   - ✅ Registrar interações
   - ✅ Exportar CSV
   - ✅ Contato via WhatsApp/Email/Call

---

## 🛡️ FASE 4 — PROTEÇÃO CONTRA DUPLICAÇÃO

### 🔒 Estratégia de Deduplicação

**Chave única:** `place_id` + `account_id`

```sql
-- Índice único composto
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_place_id_account 
ON public.companies(place_id, account_id);
```

**Comportamento:**

| Cenário | Ação |
|---------|------|
| place_id **NÃO** existe | ✅ Cria novo lead |
| place_id **JÁ** existe | ✅ Atualiza `ultima_interacao` |
| place_id **JÁ** existe em outra account | ✅ Cria novo lead (RLS garante isolamento) |

### 📜 Histórico preservado

- Quando lead já existe, apenas `ultima_interacao` é atualizado
- Campos como `lead_status`, `observacoes`, `tags` são **mantidos**
- Trigger de scoring **não é reexecutado** (apenas em INSERT)

---

## 📊 FASE 5 — LOG E AUDITORIA

### 🗄️ Nova tabela: `company_import_logs`

```sql
CREATE TABLE IF NOT EXISTS public.company_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('chat_ai', 'import_csv', 'api', 'manual')),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'skipped', 'error')),
  place_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_company_import_logs_user ON company_import_logs(user_id);
CREATE INDEX idx_company_import_logs_source ON company_import_logs(source);
CREATE INDEX idx_company_import_logs_action ON company_import_logs(action);
CREATE INDEX idx_company_import_logs_created_at ON company_import_logs(created_at DESC);

-- RLS
ALTER TABLE company_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_import_logs_read ON company_import_logs
  FOR SELECT 
  USING (auth.uid() = user_id);
```

### 📈 Queries úteis

**Ver imports do Chat AI:**
```sql
SELECT 
  action,
  COUNT(*) as total,
  COUNT(DISTINCT company_id) as empresas_unicas
FROM company_import_logs
WHERE source = 'chat_ai'
  AND user_id = auth.uid()
GROUP BY action;
```

**Últimos 10 leads criados via Chat AI:**
```sql
SELECT 
  c.name,
  c.municipio,
  c.lead_status,
  c.lead_score,
  l.created_at
FROM company_import_logs l
JOIN companies c ON l.company_id = c.id
WHERE l.source = 'chat_ai'
  AND l.action = 'created'
  AND l.user_id = auth.uid()
ORDER BY l.created_at DESC
LIMIT 10;
```

---

## 🎯 ENTREGA FINAL

### ✅ Checklist de Implementação

- [x] Analisar fluxo atual (searches → companies quebrado)
- [ ] Criar migration `20251129_integracao_chat_ai_crm.sql`
  - [ ] Adicionar campo `origem TEXT` em companies
  - [ ] Adicionar campo `data_primeiro_contato TIMESTAMPTZ` em companies
  - [ ] Criar tabela `company_import_logs`
  - [ ] Criar função `create_or_update_company_from_chat()`
  - [ ] Criar índice único `idx_companies_place_id_account`
- [ ] Modificar API `/api/scout/search/route.ts`
  - [ ] Após `searchPlaces()` sucesso
  - [ ] Loop em `result.places`
  - [ ] Chamar `create_or_update_company_from_chat()` para cada empresa
- [ ] Modificar API `/api/scout/searches/route.ts` (POST)
  - [ ] Após salvar em `searches`
  - [ ] Loop em `results` (JSONB)
  - [ ] Chamar `create_or_update_company_from_chat()` para cada empresa
- [ ] Testes
  - [ ] Buscar "restaurantes em São Paulo" via Chat AI
  - [ ] Verificar leads no CRM Master
  - [ ] Verificar KPIs atualizados
  - [ ] Verificar telemetria em `product_events`
  - [ ] Verificar logs em `company_import_logs`
  - [ ] Buscar mesma empresa novamente (deve atualizar, não duplicar)
- [ ] Documentação
  - [ ] Adicionar comentários no código
  - [ ] Atualizar FASE_P_PRODUTO_V1.md
- [ ] Commit e Push
  - [ ] git add .
  - [ ] git commit -m "feat: INTEGRAÇÃO CHAT AI → CRM MASTER"
  - [ ] git push origin main

---

## 📐 ARQUITETURA FINAL

```
┌──────────────────────────────────────────────────────────────┐
│                    CHAT AI (Scout)                            │
│  Usuário busca: "restaurantes em São Paulo"                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              API /api/scout/search (POST)                     │
│  - Chama searchPlaces()                                       │
│  - Retorna places[]                                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│         Loop: Para cada place em places[]                     │
│  ┌────────────────────────────────────────────────┐          │
│  │ create_or_update_company_from_chat()           │          │
│  │  - Verifica se place_id existe                 │          │
│  │  - SE NÃO: Cria em companies                   │          │
│  │    └─ lead_status = 'novo'                     │          │
│  │    └─ responsavel_id = user_id                 │          │
│  │    └─ origem = 'chat_ai'                       │          │
│  │    └─ ultima_interacao = NOW()                 │          │
│  │    └─ Trigger calcula lead_score               │          │
│  │    └─ Telemetria: lead_criado_via_chat         │          │
│  │    └─ Log: company_import_logs                 │          │
│  │  - SE SIM: Atualiza ultima_interacao           │          │
│  │    └─ Telemetria: lead_atualizado_via_chat     │          │
│  │    └─ Log: company_import_logs (updated)       │          │
│  └────────────────────────────────────────────────┘          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                      RESULTADO FINAL                          │
│  ✅ Leads no CRM Master                                       │
│  ✅ KPIs atualizados (Leads ativos, Hot leads, etc)           │
│  ✅ Disponível para Listas                                    │
│  ✅ Disponível para Exportação CSV                            │
│  ✅ Disponível para Propostas                                 │
│  ✅ Botões de contato (WhatsApp, Call, Email)                 │
│  ✅ Telemetria completa                                       │
│  ✅ Log de auditoria                                          │
│  ✅ Proteção contra duplicação                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 PRÓXIMOS PASSOS

Após implementação e testes:

1. **Automatizar adição em lista default**
   - Função `criar_lead_via_chat()` já adiciona em lista "Leads via Chat AI"
   - Integrar `create_or_update_company_from_chat()` com essa lista

2. **Dashboard de Chat AI Analytics**
   - Total de buscas realizadas
   - Total de leads gerados via Chat AI
   - Taxa de conversão busca → lead
   - Cidades mais buscadas
   - Categorias mais populares

3. **Enriquecimento automático**
   - Se lead criado sem CNPJ, buscar via API Receita Federal
   - Se lead criado sem email, tentar extrair de website
   - Se lead criado sem rating, buscar via Google Places API

4. **Notificações**
   - Notificar usuário quando lead Hot (score ≥ 80) for criado via Chat AI
   - Alert quando lead duplicado for encontrado (para não perder tempo)

---

## 📝 NOTAS TÉCNICAS

### ⚠️ Atenção

- **RLS (Row Level Security)**: Garantido por `account_id` em companies
- **Performance**: Índice único em (place_id, account_id) garante queries rápidas
- **Telemetria**: Eventos registrados em `product_events` para analytics
- **Auditoria**: Logs completos em `company_import_logs` para compliance
- **Scoring**: Trigger `calculate_lead_score()` executado automaticamente no INSERT

### 🔄 Compatibilidade

- **Kaix Scout desativado**: Integração funciona independente do módulo Scout
- **API create-via-chat**: Continua funcionando (usa `criar_lead_via_chat()` diferente)
- **Importação CSV**: Pode usar mesma função `create_or_update_company_from_chat()` no futuro
- **APIs externas**: Preparado para receber leads de outras fontes (source field)

---

**Autor:** GitHub Copilot  
**Versão:** 1.0  
**Status:** Pronto para implementação
