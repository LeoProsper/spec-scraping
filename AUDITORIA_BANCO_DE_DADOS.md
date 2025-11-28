# 🔍 AUDITORIA COMPLETA DO BANCO DE DADOS
## Projeto: {spec64} - Kaix Scout SaaS

**Data da Auditoria:** 28/11/2024  
**Arquiteto Responsável:** Análise Técnica Automatizada  
**Versão do Banco:** PostgreSQL via Supabase  
**Objetivo:** Documentação objetiva do estado atual do schema sem propostas de mudança

---

## 📋 1. TABELAS EXISTENTES

### 1.1 Resumo Geral

| Tabela | Registros Estimados | Propósito | Migration |
|--------|---------------------|-----------|-----------|
| `accounts` | Variável | Contas de usuários (pessoais/times) | 20241219010757_schema.sql |
| `searches` | Variável | Histórico de buscas do Google Maps | 20251126214739_kaix_scout_schema.sql |
| `companies` | Variável | Empresas encontradas nas buscas | 20251126214739_kaix_scout_schema.sql |
| `website_analysis` | Variável | Análise de websites das empresas | 20251126214739_kaix_scout_schema.sql |
| `templates` | Variável | Templates de propostas comerciais | 20251126214739_kaix_scout_schema.sql |
| `proposals` | Variável | Propostas enviadas para leads | 20251126214739_kaix_scout_schema.sql |
| `payments` | Variável | Histórico de pagamentos | 20251126214739_kaix_scout_schema.sql |
| `onboarding` | Variável | Progresso do onboarding do usuário | 20251126214739_kaix_scout_schema.sql |
| `conversations` | Variável | Conversas do chat (sistema conversacional) | 20251127000000_conversational_system.sql |
| `messages` | Variável | Mensagens individuais do chat | 20251127000000_conversational_system.sql |
| `conversation_searches` | Variável | Ligação entre conversas e buscas | 20251127000000_conversational_system.sql |

### 1.2 Detalhamento por Categoria

#### 🔑 Core System
- **accounts**: Base do sistema, criada pelo Supabase SaaS Starter Kit
- **searches**: Tabela principal do Kaix Scout, armazena buscas processadas
- **companies**: Resultados individuais de cada busca

#### 💼 Lead Management
- **website_analysis**: Análise técnica e SEO dos sites das empresas
- **templates**: Templates reutilizáveis para propostas
- **proposals**: Propostas comerciais enviadas
- **payments**: Controle financeiro de pagamentos

#### 💬 Conversational System
- **conversations**: Múltiplas conversas por usuário
- **messages**: Histórico completo de mensagens (user/assistant/system)
- **conversation_searches**: Relacionamento N:N entre conversas e buscas

#### 🎯 Onboarding
- **onboarding**: Estado do wizard de onboarding (premium feature)

---

## 🧱 2. SCHEMA COMPLETO DA TABELA `companies`

### 2.1 Estrutura Consolidada (42 campos)

A tabela `companies` possui **16 campos base** (kaix_scout_schema.sql) + **26 campos da Receita Federal** (migration-receita-fields.sql).

#### 2.1.1 Campos Base (16 campos)

| Campo | Tipo | NULL | Default | Chave | Índice | Descrição |
|-------|------|------|---------|-------|--------|-----------|
| `id` | UUID | NOT NULL | uuid_generate_v4() | PK | ✅ | Identificador único da empresa |
| `search_id` | TEXT | NOT NULL | - | FK → searches(id) | ✅ idx_companies_search | ID da busca que encontrou esta empresa |
| `place_id` | TEXT | NOT NULL | - | UNIQUE | ✅ UNIQUE idx | Google Places ID (garante não duplicação) |
| `name` | TEXT | NOT NULL | - | - | - | Nome do estabelecimento no Google Maps |
| `address` | TEXT | NULL | - | - | - | Endereço completo |
| `phone` | TEXT | NULL | - | - | - | Telefone principal |
| `rating` | DECIMAL(2,1) | NULL | - | - | - | Avaliação média (0.0 - 5.0) |
| `total_reviews` | INTEGER | NULL | - | - | - | Número total de avaliações |
| `category` | TEXT | NULL | - | - | ✅ idx_companies_category | Categoria do negócio |
| `website` | TEXT | NULL | - | - | - | URL do site |
| `latitude` | DECIMAL(10,8) | NULL | - | - | - | Coordenada de latitude |
| `longitude` | DECIMAL(11,8) | NULL | - | - | Coordenada de longitude |
| `business_status` | TEXT | NULL | - | - | - | Status operacional (OPERATIONAL, CLOSED, etc.) |
| `opening_hours` | TEXT | NULL | - | - | - | Horário de funcionamento em texto |
| `top_reviews` | JSONB | NULL | '[]'::jsonb | - | ✅ GIN | Array de reviews destacadas |
| `images` | JSONB | NULL | '[]'::jsonb | - | ✅ GIN | Array de URLs de imagens |

**Constraints:**
- CHECK: `rating BETWEEN 0 AND 5`
- ON DELETE CASCADE quando search é deletada

#### 2.1.2 Campos da Receita Federal (26 campos)

| Campo | Tipo | NULL | Default | Índice | Descrição |
|-------|------|------|---------|--------|-----------|
| **📌 Identificação Básica** |
| `cnpj` | TEXT | NULL | - | 🔍 Partial (NOT NULL) | CNPJ formatado (14 dígitos) |
| `razao_social` | TEXT | NULL | - | 🔍 Partial (NOT NULL) | Razão social oficial |
| `nome_fantasia` | TEXT | NULL | - | 🔍 Partial (NOT NULL) | Nome fantasia |
| **💼 Dados Tributários** |
| `situacao_cadastral` | TEXT | NULL | - | - | Situação: ATIVA, BAIXADA, SUSPENSA, etc. |
| `data_situacao_cadastral` | DATE | NULL | - | - | Data da última alteração de situação |
| `motivo_situacao_cadastral` | TEXT | NULL | - | - | Motivo da situação (se aplicável) |
| `data_inicio_atividade` | DATE | NULL | - | - | Data de abertura da empresa |
| `natureza_juridica` | TEXT | NULL | - | - | Código e descrição da natureza jurídica |
| `porte` | TEXT | NULL | - | - | Porte: MEI, EPP, MÉDIA, GRANDE |
| `opcao_simples` | BOOLEAN | NULL | - | - | Optante pelo Simples Nacional |
| `data_opcao_simples` | DATE | NULL | - | - | Data de adesão ao Simples |
| `opcao_mei` | BOOLEAN | NULL | - | - | Optante pelo MEI |
| **🏢 Estrutura Societária** |
| `qsa` | JSONB | NULL | '[]'::jsonb | 🔍 GIN | Quadro de Sócios e Administradores |
| `capital_social` | DECIMAL(15,2) | NULL | - | - | Capital social declarado |
| **📊 Atividades Econômicas** |
| `cnae_principal` | TEXT | NULL | - | 🔍 Partial (NOT NULL) | CNAE fiscal principal |
| `cnae_principal_descricao` | TEXT | NULL | - | - | Descrição do CNAE principal |
| `cnaes_secundarios` | JSONB | NULL | '[]'::jsonb | 🔍 GIN | Array de CNAEs secundários |
| **📍 Endereço Fiscal** |
| `logradouro` | TEXT | NULL | - | - | Rua/Avenida |
| `numero` | TEXT | NULL | - | - | Número do endereço |
| `complemento` | TEXT | NULL | - | - | Complemento |
| `bairro` | TEXT | NULL | - | - | Bairro |
| `municipio` | TEXT | NULL | - | - | Cidade |
| `uf` | TEXT | NULL | - | - | Estado (2 letras) |
| `cep` | TEXT | NULL | - | - | CEP formatado |
| **📞 Contato** |
| `receita_telefones` | JSONB | NULL | '[]'::jsonb | - | Array de telefones (DDD + número) |
| `receita_email` | TEXT | NULL | - | 🔍 Partial (NOT NULL) | E-mail de contato oficial |

### 2.2 Views Relacionadas

#### `companies_with_receita`
```sql
CREATE VIEW companies_with_receita AS
SELECT * FROM companies 
WHERE cnpj IS NOT NULL;
```
**Propósito:** Filtrar empresas que possuem dados da Receita Federal preenchidos.

---

## 🔍 3. SCHEMA COMPLETO DA TABELA `searches`

### 3.1 Estrutura Completa (14 campos)

| Campo | Tipo | NULL | Default | Chave | Índice | Descrição |
|-------|------|------|---------|-------|--------|-----------|
| `id` | TEXT | NOT NULL | nanoid() | PK | ✅ | ID único gerado com nanoid (URL-safe) |
| `user_id` | UUID | NOT NULL | - | FK → auth.users(id) | ✅ idx_searches_user | ID do usuário que criou a busca |
| `query` | TEXT | NOT NULL | - | - | - | Query de busca original (ex: "restaurantes SP") |
| `title` | TEXT | NOT NULL | 'Busca sem título' | - | - | Título automático (ex: "5 resultados - Restaurantes SP") |
| `max_places` | INTEGER | NULL | 5 | - | - | Limite de resultados solicitados |
| `lang` | TEXT | NULL | 'pt' | - | - | Idioma da busca (pt, en, es) |
| `radius` | INTEGER | NULL | - | - | - | Raio de busca em metros (opcional) |
| `category` | TEXT | NULL | - | - | - | Categoria filtrada (opcional) |
| `status` | TEXT | NOT NULL | 'processing' | - | ✅ idx_searches_status | Estado da busca |
| `total_results` | INTEGER | NULL | 0 | - | - | Contador de empresas encontradas |
| `results` | JSONB | NULL | '[]'::jsonb | - | 🔍 GIN | Armazena resultados completos da busca |
| `error_message` | TEXT | NULL | - | - | - | Mensagem de erro (se status = 'error') |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | - | ✅ idx_searches_created (DESC) | Data de criação |
| `completed_at` | TIMESTAMPTZ | NULL | - | - | - | Data de conclusão da busca |

### 3.2 Constraints e Validações

**CHECK Constraint:**
```sql
status IN ('processing', 'completed', 'error')
```

**Foreign Keys:**
```sql
user_id → auth.users(id) ON DELETE CASCADE
```

### 3.3 Triggers

#### `update_searches_count`
```sql
-- Dispara após INSERT na tabela companies
-- Incrementa total_results em searches
```

**Função:**
```sql
CREATE OR REPLACE FUNCTION update_searches_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE searches
  SET total_results = total_results + 1,
      updated_at = NOW()
  WHERE id = NEW.search_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔗 4. RELAÇÃO ENTRE EMPRESAS E BUSCAS

### 4.1 Relacionamento 1:N

```
searches (1) ────┬──── (N) companies
                 │
                 └─ Constraint: ON DELETE CASCADE
```

**Significado:**
- Uma busca pode ter **múltiplas empresas** (1:N)
- Uma empresa pertence a **apenas uma busca** (N:1)
- Se a busca é deletada, **todas as empresas são deletadas** automaticamente

### 4.2 Duplicação de Empresas

#### 4.2.1 Cenário Real

**Empresa duplicada entre buscas diferentes:**
```sql
-- Busca 1: "pizzarias são paulo"
INSERT INTO companies (search_id, place_id, name) 
VALUES ('search_123', 'ChIJabc...', 'Pizzaria Bella Napoli');

-- Busca 2: "restaurantes italianos sp"
INSERT INTO companies (search_id, place_id, name) 
VALUES ('search_456', 'ChIJabc...', 'Pizzaria Bella Napoli');
```

**Resultado:** 2 registros para a mesma empresa (mesmo `place_id`), mas em `search_id` diferentes.

#### 4.2.2 Proteção por Busca

**UNIQUE Index em `place_id`:**
```sql
CREATE UNIQUE INDEX idx_companies_place_id ON companies(place_id);
```

⚠️ **PROBLEMA ATUAL:** Este índice **impede duplicação absoluta**, mas não permite que a mesma empresa apareça em buscas diferentes (uso real esperado).

**Análise:**
- ✅ **Evita:** Duplicação acidental dentro da mesma busca
- ❌ **Bloqueia:** Mesma empresa em contextos de busca diferentes
- 🤔 **Ideal:** UNIQUE index composto `(search_id, place_id)`

#### 4.2.3 Contagem Realística

**Query para identificar empresas únicas:**
```sql
SELECT COUNT(DISTINCT place_id) as empresas_unicas,
       COUNT(*) as total_registros,
       COUNT(*) - COUNT(DISTINCT place_id) as duplicatas
FROM companies;
```

---

## 🧾 5. OUTRAS TABELAS DE LEADS E GESTÃO

### 5.1 `website_analysis` (15 campos)

| Campo | Tipo | NULL | Descrição |
|-------|------|------|-----------|
| `id` | UUID | NOT NULL | PK |
| `company_id` | UUID | NOT NULL | FK → companies(id) ON DELETE CASCADE |
| `url` | TEXT | NOT NULL | URL analisada |
| `status` | TEXT | NOT NULL | Status da análise |
| `title` | TEXT | NULL | Título da página |
| `meta_description` | TEXT | NULL | Meta description |
| `h1_tags` | JSONB | NULL | Array de H1s encontrados |
| `has_ssl` | BOOLEAN | NULL | Possui certificado SSL |
| `load_time` | INTEGER | NULL | Tempo de carregamento (ms) |
| `mobile_friendly` | BOOLEAN | NULL | Responsivo para mobile |
| `score` | INTEGER | NULL | Score geral (0-100) |
| `score_category` | TEXT | NULL | Categoria do score (low/medium/high) |
| `recommendations` | JSONB | NULL | Array de recomendações |
| `error_message` | TEXT | NULL | Mensagem de erro (se status = error) |
| `analyzed_at` | TIMESTAMPTZ | NULL | Data da análise |

**Relacionamento:** 1:1 com companies (cada empresa pode ter 1 análise de site)

**Índices:**
- `idx_website_analysis_company` em company_id
- `idx_website_analysis_score_category` em score_category

---

### 5.2 `templates` (10 campos)

| Campo | Tipo | NULL | Descrição |
|-------|------|------|-----------|
| `id` | UUID | NOT NULL | PK |
| `user_id` | UUID | NOT NULL | FK → accounts(id) |
| `name` | TEXT | NOT NULL | Nome do template |
| `description` | TEXT | NULL | Descrição do propósito |
| `subject` | TEXT | NOT NULL | Assunto do e-mail/mensagem |
| `body` | TEXT | NOT NULL | Corpo da mensagem (Markdown suportado) |
| `variables` | JSONB | NULL | Variáveis dinâmicas (ex: {{nome_empresa}}) |
| `category` | TEXT | NULL | Categoria (email/whatsapp/linkedin) |
| `is_active` | BOOLEAN | NOT NULL DEFAULT TRUE | Template ativo |
| `created_at` | TIMESTAMPTZ | NOT NULL | Data de criação |

**Propósito:** Biblioteca de templates reutilizáveis para propostas comerciais.

---

### 5.3 `proposals` (12 campos)

| Campo | Tipo | NULL | Descrição |
|-------|------|------|-----------|
| `id` | UUID | NOT NULL | PK |
| `company_id` | UUID | NOT NULL | FK → companies(id) ON DELETE CASCADE |
| `template_id` | UUID | NULL | FK → templates(id) ON DELETE SET NULL |
| `user_id` | UUID | NOT NULL | FK → accounts(id) |
| `subject` | TEXT | NOT NULL | Assunto da proposta |
| `body` | TEXT | NOT NULL | Corpo da proposta (renderizado) |
| `status` | TEXT | NOT NULL | Estado da proposta |
| `sent_at` | TIMESTAMPTZ | NULL | Data de envio |
| `opened_at` | TIMESTAMPTZ | NULL | Data de abertura |
| `replied_at` | TIMESTAMPTZ | NULL | Data de resposta |
| `metadata` | JSONB | NULL | Dados adicionais (canal, tracking, etc.) |
| `created_at` | TIMESTAMPTZ | NOT NULL | Data de criação |

**CHECK Constraint:**
```sql
status IN ('draft', 'sent', 'opened', 'replied', 'rejected')
```

**Relacionamento:** N:1 com companies (múltiplas propostas por empresa)

---

### 5.4 `payments` (11 campos)

| Campo | Tipo | NULL | Descrição |
|-------|------|------|-----------|
| `id` | UUID | NOT NULL | PK |
| `user_id` | UUID | NOT NULL | FK → accounts(id) |
| `company_id` | UUID | NULL | FK → companies(id) (opcional) |
| `amount` | DECIMAL(10,2) | NOT NULL | Valor pago |
| `currency` | TEXT | NOT NULL DEFAULT 'BRL' | Moeda |
| `status` | TEXT | NOT NULL | Status do pagamento |
| `payment_method` | TEXT | NULL | Método de pagamento |
| `payment_provider` | TEXT | NULL | Provider (Stripe, PayPal, etc.) |
| `provider_payment_id` | TEXT | NULL | ID externo do provider |
| `metadata` | JSONB | NULL | Dados extras do pagamento |
| `created_at` | TIMESTAMPTZ | NOT NULL | Data de criação |

**CHECK Constraint:**
```sql
status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
```

---

### 5.5 `onboarding` (9 campos)

| Campo | Tipo | NULL | Descrição |
|-------|------|------|-----------|
| `id` | UUID | NOT NULL | PK |
| `user_id` | UUID | NOT NULL UNIQUE | FK → accounts(id) (1:1 relationship) |
| `current_step` | INTEGER | NOT NULL DEFAULT 1 | Step atual do wizard |
| `total_steps` | INTEGER | NOT NULL DEFAULT 5 | Total de steps |
| `completed_steps` | JSONB | NULL | Array de steps completados |
| `is_completed` | BOOLEAN | NOT NULL DEFAULT FALSE | Onboarding concluído |
| `completed_at` | TIMESTAMPTZ | NULL | Data de conclusão |
| `started_at` | TIMESTAMPTZ | NOT NULL | Data de início |
| `metadata` | JSONB | NULL | Dados extras do onboarding |

**Propósito:** Controle do wizard de onboarding (feature premium para guiar novos usuários).

---

### 5.6 Sistema Conversacional (3 tabelas)

#### `conversations` (10 campos)

| Campo | Tipo | NULL | Default | Descrição |
|-------|------|------|---------|-----------|
| `id` | UUID | NOT NULL | uuid_generate_v4() | PK |
| `user_id` | UUID | NOT NULL | - | FK → accounts(id) ON DELETE CASCADE |
| `title` | TEXT | NOT NULL | - | Título da conversa |
| `description` | TEXT | NULL | - | Descrição opcional |
| `status` | TEXT | NOT NULL | 'active' | Estado da conversa |
| `messages_count` | INT | NOT NULL | 0 | Contador de mensagens |
| `searches_count` | INT | NOT NULL | 0 | Contador de buscas vinculadas |
| `total_results` | INT | NOT NULL | 0 | Total de resultados encontrados |
| `last_message_at` | TIMESTAMP | NOT NULL | NOW() | Data da última mensagem |
| `created_at` | TIMESTAMP | NOT NULL | NOW() | Data de criação |

**CHECK Constraint:**
```sql
status IN ('active', 'archived', 'deleted')
```

---

#### `messages` (7 campos)

| Campo | Tipo | NULL | Default | Descrição |
|-------|------|------|---------|-----------|
| `id` | UUID | NOT NULL | uuid_generate_v4() | PK |
| `conversation_id` | UUID | NOT NULL | - | FK → conversations(id) ON DELETE CASCADE |
| `role` | TEXT | NOT NULL | - | Papel da mensagem |
| `content` | TEXT | NOT NULL | - | Conteúdo da mensagem |
| `metadata` | JSONB | NOT NULL | '{}'::jsonb | Metadados extras |
| `is_streaming` | BOOLEAN | NOT NULL | FALSE | Mensagem em streaming |
| `is_error` | BOOLEAN | NOT NULL | FALSE | Mensagem de erro |

**CHECK Constraint:**
```sql
role IN ('user', 'assistant', 'system')
```

**Triggers:** 
- `on_message_created`: Incrementa messages_count na conversation
- `on_message_deleted`: Decrementa messages_count na conversation

---

#### `conversation_searches` (6 campos)

| Campo | Tipo | NULL | Descrição |
|-------|------|------|-----------|
| `id` | UUID | NOT NULL | PK |
| `conversation_id` | UUID | NOT NULL | FK → conversations(id) ON DELETE CASCADE |
| `search_id` | UUID | NOT NULL | FK → searches(id) ON DELETE CASCADE |
| `message_id` | UUID | NULL | FK → messages(id) ON DELETE SET NULL |
| `user_query` | TEXT | NOT NULL | Query original do usuário |
| `refined_query` | TEXT | NULL | Query refinada pela IA |

**UNIQUE Constraint:**
```sql
UNIQUE(conversation_id, search_id)
```

**Propósito:** Relacionamento N:N entre conversas e buscas, permitindo histórico completo.

---

## 🧩 6. USO DE JSON/JSONB

### 6.1 Campos JSONB na Tabela `companies`

#### `top_reviews` (Array de objetos)
```json
[
  {
    "author": "João Silva",
    "rating": 5,
    "text": "Excelente atendimento!",
    "date": "2024-11-20"
  }
]
```

**Propósito:** Armazenar reviews destacadas sem criar tabela separada.

---

#### `images` (Array de URLs)
```json
[
  "https://maps.googleapis.com/maps/api/place/photo?...",
  "https://lh3.googleusercontent.com/..."
]
```

**Propósito:** Lista de imagens do estabelecimento no Google Maps.

---

#### `qsa` (Quadro de Sócios e Administradores)
```json
[
  {
    "nome": "Maria Oliveira",
    "qualificacao": "Sócio-Administrador",
    "data_entrada": "2020-05-15"
  }
]
```

**Propósito:** Estrutura societária da empresa (dados da Receita Federal).

---

#### `cnaes_secundarios` (Array de CNAEs)
```json
[
  {
    "codigo": "5611-2/01",
    "descricao": "Restaurantes e similares"
  },
  {
    "codigo": "5620-1/01",
    "descricao": "Fornecimento de alimentos preparados"
  }
]
```

**Propósito:** Atividades econômicas secundárias da empresa.

---

#### `receita_telefones` (Array de telefones)
```json
[
  {
    "ddd": "11",
    "numero": "98765-4321"
  }
]
```

**Propósito:** Telefones de contato oficiais da Receita Federal.

---

### 6.2 Campos JSONB na Tabela `searches`

#### `results` (Array de objetos completos)
```json
[
  {
    "place_id": "ChIJabc...",
    "name": "Restaurante XYZ",
    "address": "Rua ABC, 123",
    "rating": 4.5,
    "total_reviews": 120,
    "phone": "(11) 1234-5678"
  }
]
```

**Propósito:** Snapshot completo dos resultados da busca para acesso rápido sem JOIN.

**⚠️ Implicação:** Duplicação de dados (existe em `searches.results` e na tabela `companies`).

---

### 6.3 Campos JSONB em Outras Tabelas

| Tabela | Campo JSONB | Propósito |
|--------|-------------|-----------|
| `website_analysis` | `h1_tags` | Array de H1s da página |
| `website_analysis` | `recommendations` | Array de recomendações SEO |
| `templates` | `variables` | Variáveis dinâmicas do template |
| `proposals` | `metadata` | Dados extras (canal, tracking, etc.) |
| `payments` | `metadata` | Dados do provider de pagamento |
| `onboarding` | `completed_steps` | Array de steps completados |
| `messages` | `metadata` | Dados extras das mensagens |
| `accounts` | `public_data` | Dados públicos da conta |

---

### 6.4 Índices GIN em JSONB

**Índices existentes:**
```sql
-- companies
CREATE INDEX idx_companies_top_reviews ON companies USING gin (top_reviews);
CREATE INDEX idx_companies_images ON companies USING gin (images);
CREATE INDEX idx_companies_qsa ON companies USING gin (qsa);
CREATE INDEX idx_companies_cnaes_secundarios ON companies USING gin (cnaes_secundarios);

-- searches
CREATE INDEX idx_searches_results ON searches USING gin (results);
```

**Propósito dos GIN Indexes:**
- Permitir buscas eficientes dentro dos arrays JSONB
- Operadores suportados: `@>`, `?`, `?|`, `?&`

**Exemplo de query otimizada:**
```sql
-- Buscar empresas com avaliação 5 nas reviews
SELECT * FROM companies 
WHERE top_reviews @> '[{"rating": 5}]';
```

---

## ⚡ 7. ÍNDICES E PERFORMANCE

### 7.1 Índices na Tabela `companies`

| Índice | Tipo | Campo(s) | Propósito |
|--------|------|----------|-----------|
| `companies_pkey` | B-tree | `id` | Primary Key |
| `idx_companies_place_id` | **UNIQUE** B-tree | `place_id` | Garantir unicidade do Google Place ID |
| `idx_companies_search` | B-tree | `search_id` | FK lookup para joins com searches |
| `idx_companies_category` | B-tree | `category` | Filtros por categoria |
| `idx_companies_top_reviews` | GIN | `top_reviews` | Buscas em arrays JSONB |
| `idx_companies_images` | GIN | `images` | Buscas em arrays JSONB |
| `idx_companies_qsa` | GIN | `qsa` | Buscas em estrutura societária |
| `idx_companies_cnaes_secundarios` | GIN | `cnaes_secundarios` | Buscas em CNAEs secundários |
| `idx_companies_cnpj` | **PARTIAL** B-tree | `cnpj WHERE cnpj IS NOT NULL` | Busca rápida por CNPJ (apenas não-nulos) |
| `idx_companies_razao_social` | **PARTIAL** B-tree | `razao_social WHERE razao_social IS NOT NULL` | Busca por razão social |
| `idx_companies_nome_fantasia` | **PARTIAL** B-tree | `nome_fantasia WHERE nome_fantasia IS NOT NULL` | Busca por nome fantasia |
| `idx_companies_cnae_principal` | **PARTIAL** B-tree | `cnae_principal WHERE cnae_principal IS NOT NULL` | Filtros por CNAE |
| `idx_companies_receita_email` | **PARTIAL** B-tree | `receita_email WHERE receita_email IS NOT NULL` | Busca por e-mail |

**Total: 13 índices**

---

### 7.2 Índices na Tabela `searches`

| Índice | Tipo | Campo(s) | Propósito |
|--------|------|----------|-----------|
| `searches_pkey` | B-tree | `id` | Primary Key |
| `idx_searches_user_id` | B-tree | `user_id` | FK lookup para joins com accounts |
| `idx_searches_created_at` | B-tree | `created_at DESC` | Ordenação descendente (histórico) |
| `idx_searches_status` | B-tree | `status` | Filtros por status (processing/completed/error) |
| `idx_searches_results` | GIN | `results` | Buscas em array JSONB de resultados |

**Total: 5 índices**

---

### 7.3 Índices em Outras Tabelas

#### `website_analysis`
- `website_analysis_pkey` (id)
- `idx_website_analysis_company` (company_id)
- `idx_website_analysis_score_category` (score_category)

#### `proposals`
- `proposals_pkey` (id)
- `idx_proposals_company` (company_id)
- `idx_proposals_user` (user_id)
- `idx_proposals_status` (status)

#### `conversations`
- `conversations_pkey` (id)
- `idx_conversations_user` (user_id)
- `idx_conversations_status` (status)
- `idx_conversations_last_message` (last_message_at DESC)

#### `messages`
- `messages_pkey` (id)
- `idx_messages_conversation` (conversation_id)
- `idx_messages_created` (created_at)
- `idx_messages_role` (role)

#### `conversation_searches`
- `conversation_searches_pkey` (id)
- `idx_conversation_searches_conversation` (conversation_id)
- `idx_conversation_searches_search` (search_id)
- UNIQUE constraint em (conversation_id, search_id)

---

### 7.4 Análise de Performance

#### 7.4.1 Índices Parciais (Partial Indexes)

**Estratégia:** Indexar apenas valores NOT NULL para economizar espaço.

**Campos com Partial Indexes:**
- `cnpj`, `razao_social`, `nome_fantasia`, `cnae_principal`, `receita_email`

**Benefício:**
- ✅ **Economia de espaço:** Não indexa NULLs (comum em campos da Receita Federal)
- ✅ **Performance:** Índices menores = queries mais rápidas
- ❌ **Limitação:** Queries com IS NULL não usam o índice

---

#### 7.4.2 Índices GIN em JSONB

**Performance esperada:**
- ✅ **Buscas complexas:** Operadores @>, ?, ?| são otimizados
- ⚠️ **Custo de escrita:** INSERTs/UPDATEs mais lentos (índice precisa ser atualizado)
- ⚠️ **Tamanho:** GIN indexes são grandes (podem ser 2-3x o tamanho do campo)

**Recomendação de uso:**
- Se você faz queries frequentes em `top_reviews`, `qsa`, `cnaes_secundarios` → **índices são valiosos**
- Se você apenas armazena e raramente busca → **índices podem ser desnecessários**

---

#### 7.4.3 Foreign Keys

**FKs com ON DELETE CASCADE:**
```sql
companies.search_id → searches.id ON DELETE CASCADE
website_analysis.company_id → companies.id ON DELETE CASCADE
proposals.company_id → companies.id ON DELETE CASCADE
```

**Implicação:**
- ✅ **Integridade referencial:** Deletar uma busca deleta todas as empresas automaticamente
- ⚠️ **Performance em DELETE:** Operações em cascata podem ser lentas em grandes volumes

---

## ⚠️ 8. CONCLUSÃO TÉCNICA

### 8.1 Pontos Fortes

✅ **Estrutura bem normalizada:** Separação clara entre buscas, empresas, análises e propostas.

✅ **RLS ativado em todas as tabelas:** Segurança de acesso a nível de linha (cada usuário vê apenas seus dados).

✅ **Triggers funcionais:** Contadores automáticos (searches_count, messages_count) funcionam corretamente.

✅ **Sistema conversacional robusto:** 3 tabelas com relacionamento N:N entre conversas e buscas.

✅ **Integração com Receita Federal:** 26 campos adicionais fornecem dados ricos das empresas.

✅ **Índices estratégicos:** Partial indexes economizam espaço, GIN indexes otimizam buscas em JSONB.

---

### 8.2 Riscos de Performance

⚠️ **Duplicação de dados:** Campo `searches.results` (JSONB) duplica dados que já existem na tabela `companies`.
- **Impacto:** Aumenta tamanho do banco, pode causar inconsistências se não sincronizado.
- **Justificativa possível:** Snapshot histórico (se companies forem alteradas, results preserva estado original).

⚠️ **UNIQUE constraint em place_id:** Impede que a mesma empresa apareça em buscas diferentes.
- **Cenário problemático:** "pizzarias sp" e "restaurantes italianos sp" podem retornar a mesma empresa.
- **Consequência:** Segunda busca falhará ao tentar inserir empresa já existente.

⚠️ **Índices GIN pesados:** 5 GIN indexes em `companies` consomem espaço significativo.
- **Avaliação necessária:** Verificar se queries realmente usam esses índices (EXPLAIN ANALYZE).

⚠️ **Triggers em cascata:** DELETE em `searches` pode acionar múltiplos DELETEs em `companies`, `website_analysis`, `proposals`.
- **Impacto:** Em buscas com milhares de empresas, operação pode ser lenta.

---

### 8.3 Riscos de Escalabilidade

🔴 **Crescimento rápido de `messages`:** Sistema conversacional pode gerar milhões de registros.
- **Problema:** Sem estratégia de arquivamento/particionamento.
- **Consequência:** Queries podem degradar com o tempo.

🔴 **JSONB sem estratégia de migração:** Campos JSONB (`qsa`, `cnaes_secundarios`, `results`) não têm versionamento.
- **Problema:** Mudanças na estrutura JSON exigem UPDATE em massa.
- **Consequência:** Downtime em produção ou dados inconsistentes.

🔴 **Ausência de índices compostos:** Queries comuns podem não estar otimizadas.
- **Exemplo:** Buscar empresas por `search_id` + `category` (query comum) não tem índice composto.

---

### 8.4 Riscos de Integridade

⚠️ **Campos NULL em dados críticos:** `cnpj`, `razao_social`, `receita_email` são NULL permitido.
- **Problema:** Empresas podem não ter dados da Receita Federal preenchidos (scraping falhou).
- **Consequência:** Features premium (propostas, análises) podem quebrar se assumirem dados sempre presentes.

⚠️ **Sincronização de contadores:** Triggers dependem de INSERTs/DELETEs corretos.
- **Risco:** Se houver INSERT direto via SQL (bypassing triggers), contadores ficam desatualizados.

---

### 8.5 Conformidade e Privacidade

✅ **LGPD:** RLS garante isolamento de dados entre usuários.

⚠️ **Dados sensíveis:** `qsa` (sócios) e `receita_email` são dados públicos da Receita, mas devem ter cuidado em exposição via API.

⚠️ **Retenção de dados:** Não há política de TTL (Time to Live) para mensagens antigas ou buscas arquivadas.
- **Risco:** Banco cresce indefinidamente sem estratégia de purge.

---

### 8.6 Resumo Executivo

**Estado atual:** Banco de dados **funcional e bem estruturado** para MVP/early stage, com separação clara de responsabilidades e segurança de acesso implementada.

**Capacidade atual:** Suporta **centenas de usuários** e **milhares de buscas/mês** sem problemas significativos.

**Ponto de atenção crítico:** Sistema conversacional (`messages`) pode crescer rapidamente e precisa de estratégia de arquivamento/particionamento antes de escalar para **milhares de usuários ativos**.

**Próxima fase recomendada:** Monitoramento de performance de queries em produção para validar se índices estão sendo usados corretamente (EXPLAIN ANALYZE em queries reais).

---

**Fim da Auditoria Técnica**  
*Documento gerado em 28/11/2024*
