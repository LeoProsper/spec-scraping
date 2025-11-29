# AI Layer Overview - SPEC64

## 📋 Visão Geral

A camada de IA do SPEC64 é uma infraestrutura centralizada e reutilizável que gerencia todas as interações com a OpenAI. Ela foi projetada para escalabilidade, rastreamento de uso e integração fácil em qualquer módulo do sistema.

## 🎯 Objetivos

1. **Centralização**: Único ponto de acesso para todas as operações de IA
2. **Múltiplos Modos**: Suporte a diferentes casos de uso (chat, geração B2B, assistente CRM, etc.)
3. **Segurança**: Autenticação obrigatória e isolamento de dados
4. **Rastreamento**: Logging completo de uso por usuário
5. **Rate Limiting**: Proteção contra abuso e controle de custos
6. **Resiliência**: Retry automático, timeout e tratamento de erros
7. **Futuro**: Preparado para sistema de créditos e planos

## 🏗️ Arquitetura

```
Frontend
   ↓
POST /api/ai/run (autenticado)
   ↓
Rate Limiting Check
   ↓
runAI() Service
   ↓
OpenAI API (com retry/timeout)
   ↓
Logging → ai_usage_logs
   ↓
Response ao Frontend
```

## 📁 Estrutura de Arquivos

```
apps/web/
├── lib/ai/
│   ├── config.ts              # Configuração e leitura de env
│   ├── openai.service.ts      # Serviço central de IA
│   └── rate-limit.ts          # Rate limiting em memória
├── app/api/ai/
│   └── run/
│       └── route.ts           # Endpoint genérico /api/ai/run
└── supabase/migrations/
    └── 20251129_create_ai_usage_logs.sql  # Tabela de logs
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-seu_token_aqui
OPENAI_MODEL_DEFAULT=gpt-4o-mini
OPENAI_MODEL_HIGH=gpt-4o
OPENAI_MAX_TOKENS=1200
OPENAI_TIMEOUT_MS=45000
```

### 2. Instalação

A dependência `openai` já está instalada:

```bash
pnpm add openai
```

### 3. Migration

A tabela `ai_usage_logs` já foi criada no banco:

```sql
-- Tabela para rastreamento de uso
public.ai_usage_logs (
  id, user_id, mode, metadata, tokens_used, 
  duration_ms, success, error_code, created_at
)

-- View de estatísticas
public.ai_usage_stats

-- Função de rate limiting
public.check_ai_rate_limit(user_id, limit, window_minutes)
```

## 🔧 Uso Interno (Backend)

### Chamando runAI() diretamente

```typescript
import { runAI } from '@/lib/ai/openai.service';

const result = await runAI({
  mode: 'B2B_GENERATOR',
  userId: user.id,
  user: 'Gerar oportunidade para empresas de tecnologia em São Paulo',
  context: 'Categoria: Web & Digital',
  metadata: {
    source: 'b2b_generator',
    category: 'Web & Digital'
  }
});

console.log(result.text);
// "Encontrar empresas de desenvolvimento web em São Paulo que ainda usam sites desatualizados sem responsividade mobile"
```

### Modos Disponíveis

```typescript
type AIMode =
  | 'CHAT'                // Chat genérico
  | 'B2B_GENERATOR'       // Gerador de oportunidades B2B
  | 'CRM_ASSISTANT'       // Assistente para CRM (análise de leads)
  | 'PROPOSAL_WRITER'     // Geração de propostas comerciais
  | 'EMAIL_OUTREACH'      // Criação de emails de outreach
  | 'CLASSIFICATION';     // Classificação de dados
```

Cada modo tem um **system prompt base** otimizado para seu propósito.

### Parâmetros Completos

```typescript
interface RunAIParams {
  mode: AIMode;              // Modo de operação (obrigatório)
  userId: string;            // ID do usuário (obrigatório)
  user: string;              // Mensagem do usuário (obrigatório)
  system?: string;           // Override do system prompt
  context?: string;          // Contexto adicional
  maxTokens?: number;        // Limite de tokens (padrão: 1200)
  temperature?: number;      // Criatividade 0-2 (padrão: 0.7)
  metadata?: Record<string, any>;  // Metadados para logging
}
```

## 🌐 Uso Externo (Frontend)

### Chamando via API

```typescript
// Exemplo: Gerar oportunidade B2B
const response = await fetch('/api/ai/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mode: 'B2B_GENERATOR',
    user: 'Empresas de e-commerce que precisam melhorar conversão',
    context: 'Região: Sul do Brasil',
    metadata: {
      source: 'b2b_generator',
      category: 'E-commerce'
    }
  })
});

const data = await response.json();

if (data.success) {
  console.log('Resultado:', data.result);
  console.log('Rate Limit:', data.rateLimitStatus);
  // { limit: 60, remaining: 59, resetAt: "2025-11-29T15:00:00Z" }
} else {
  console.error('Erro:', data.error, data.code);
}
```

### Response (Sucesso)

```json
{
  "success": true,
  "mode": "B2B_GENERATOR",
  "result": "Texto gerado pela IA...",
  "rateLimitStatus": {
    "limit": 60,
    "remaining": 59,
    "resetAt": "2025-11-29T15:00:00.000Z"
  }
}
```

### Response (Erro)

```json
{
  "success": false,
  "error": "Mensagem amigável do erro",
  "code": "AI_TIMEOUT" | "AI_RATE_LIMIT" | "AI_INTERNAL_ERROR",
  "rateLimitStatus": { ... }  // Apenas em rate limit
}
```

## 🚦 Rate Limiting

### Configuração Atual

- **Limite**: 60 requisições por hora por usuário
- **Implementação**: Em memória (desenvolvimento)
- **Reset**: Automático após 1 hora

### Produção (Futuro)

Para produção, migre para:

1. **Redis**: Rate limiting distribuído
2. **Supabase Function**: Usar `check_ai_rate_limit()`
3. **Planos com Créditos**: Tabela `accounts` com campos:
   - `ai_credits_monthly`
   - `ai_credits_used`

### Verificar Rate Limit

```typescript
import { getRateLimitStatus } from '@/lib/ai/rate-limit';

const status = getRateLimitStatus(userId);
console.log(status);
// { remaining: 59, resetAt: 1732896000000, limit: 60 }
```

## 📊 Logging e Analytics

### Tabela ai_usage_logs

Todos os usos são registrados automaticamente:

```sql
SELECT 
  user_id,
  mode,
  success,
  tokens_used,
  duration_ms,
  metadata,
  created_at
FROM ai_usage_logs
WHERE user_id = 'xxx'
ORDER BY created_at DESC;
```

### View de Estatísticas

```sql
SELECT * FROM ai_usage_stats
WHERE user_id = 'xxx';

-- Retorna:
-- user_id, mode, total_requests, successful_requests, 
-- failed_requests, total_tokens, avg_duration_ms, last_used_at
```

### Queries Úteis

```sql
-- Total de tokens por usuário (mês atual)
SELECT 
  user_id,
  SUM(tokens_used) as total_tokens
FROM ai_usage_logs
WHERE created_at >= date_trunc('month', now())
GROUP BY user_id;

-- Modos mais usados
SELECT 
  mode,
  COUNT(*) as usage_count,
  AVG(duration_ms) as avg_duration
FROM ai_usage_logs
WHERE success = true
GROUP BY mode;

-- Taxa de erro por modo
SELECT 
  mode,
  COUNT(*) filter (where success = false) * 100.0 / COUNT(*) as error_rate
FROM ai_usage_logs
GROUP BY mode;
```

## 🔄 Retry e Timeout

### Retry Automático

O serviço tenta até **3 vezes** com backoff exponencial:

- Tentativa 1: Imediato
- Tentativa 2: Aguarda 1s
- Tentativa 3: Aguarda 2s

### Timeout

- **Padrão**: 45 segundos
- **Configurável**: `OPENAI_TIMEOUT_MS`
- **Erro**: Retorna `AI_TIMEOUT` após esgotar tentativas

## 🛡️ Segurança

### Autenticação

- Endpoint `/api/ai/run` requer autenticação Supabase
- Usuário identificado via `supabase.auth.getUser()`

### Isolamento de Dados

- Logs são isolados por usuário via RLS
- Cada usuário só vê seus próprios logs

### Proteção de API Key

- API key da OpenAI nunca exposta ao frontend
- Leitura segura via `getAIConfig()` no backend

## 🚀 Integrações Atuais

### 1. Gerador de Oportunidades B2B

**Localização**: `/home/opportunities` (página de oportunidades)

**Como integrar**:

```typescript
// No componente React
const generateOpportunity = async () => {
  const response = await fetch('/api/ai/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'B2B_GENERATOR',
      user: userInput,  // "Empresas de SaaS em crescimento"
      metadata: {
        source: 'b2b_generator',
        category: selectedCategory
      }
    })
  });

  const data = await response.json();
  if (data.success) {
    setGeneratedPrompt(data.result);
  }
};
```

### 2. Chat AI (Futuro)

Migrar chamadas diretas da OpenAI para usar `runAI()`:

```typescript
// Antes (direto)
const response = await openai.chat.completions.create(...);

// Depois (via serviço)
const result = await runAI({
  mode: 'CHAT',
  userId: user.id,
  user: userMessage,
  context: conversationHistory
});
```

## 📝 System Prompts por Modo

### B2B_GENERATOR

```
Você é um estrategista de prospecção B2B.
Sua função é gerar frases curtas, objetivas e ultra claras que descrevem 
oportunidades de negócio para encontrar empresas com algum problema, 
falha ou oportunidade real.

Regras:
- Máx. 1 frase.
- Sem explicação, apenas a instrução.
- Focar sempre em empresa-alvo B2B (quem VAI vender).
- Sempre incluir: tipo de empresa, região opcional, critério de dor/problema, 
  e o que está errado/faltando.
```

### CRM_ASSISTANT

```
Você é um assistente comercial que analisa leads, listas e interações.
Sua função é priorizar, resumir e sugerir próximos passos de contato, 
sem inventar dados que não existam.
```

### PROPOSAL_WRITER

```
Você é um especialista em criação de propostas comerciais B2B.
Sua função é estruturar propostas claras, objetivas e persuasivas 
baseadas em dados reais da empresa e do lead.
```

### EMAIL_OUTREACH

```
Você é um especialista em cold email e outreach B2B.
Sua função é criar mensagens personalizadas, diretas e com alta taxa 
de conversão.
```

### CLASSIFICATION

```
Você é um classificador especializado.
Sua função é categorizar e organizar informações de forma consistente 
e precisa.
```

### CHAT

```
Você é um assistente útil e prestativo que responde de forma clara 
e objetiva.
```

## 🔮 Roadmap (Futuro)

### Fase 1: Controle de Créditos

Adicionar em `accounts`:

```sql
ALTER TABLE accounts 
ADD COLUMN ai_credits_monthly INTEGER DEFAULT 100,
ADD COLUMN ai_credits_used INTEGER DEFAULT 0;
```

Verificar antes de `runAI()`:

```typescript
if (account.ai_credits_used >= account.ai_credits_monthly) {
  throw new AIError('Credits exceeded', AIErrorCode.RATE_LIMIT);
}
```

### Fase 2: Streaming

Suportar respostas em streaming para chat:

```typescript
const stream = await runAIStream({
  mode: 'CHAT',
  userId: user.id,
  user: message
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

### Fase 3: Múltiplos Providers

Suporte para Anthropic, Google, etc.:

```typescript
runAI({
  mode: 'CHAT',
  provider: 'openai' | 'anthropic' | 'google',
  // ...
});
```

## 🐛 Troubleshooting

### Erro: "AI layer is not properly configured"

**Causa**: `OPENAI_API_KEY` não configurada

**Solução**: 

```bash
# Adicione ao .env.local
OPENAI_API_KEY=sk-proj-seu_token_aqui
```

### Erro: "Rate limit exceeded"

**Causa**: Usuário excedeu 60 req/hora

**Solução**: Aguardar reset (1 hora) ou aumentar limite em desenvolvimento

```typescript
import { resetRateLimit } from '@/lib/ai/rate-limit';
resetRateLimit(userId);  // Apenas em dev
```

### Erro: "AI request timed out"

**Causa**: Requisição demorou mais de 45s

**Solução**: 

1. Reduzir `maxTokens`
2. Simplificar prompt
3. Aumentar `OPENAI_TIMEOUT_MS`

### Performance Lenta

**Causa**: Modelo `gpt-4o` é mais lento

**Solução**: Usar `gpt-4o-mini` para operações rápidas

```typescript
// No config.ts, altere:
OPENAI_MODEL_DEFAULT=gpt-4o-mini  // Rápido e barato
OPENAI_MODEL_HIGH=gpt-4o          // Para casos complexos
```

## 📚 Exemplos Práticos

### Exemplo 1: Gerar Oportunidade B2B

```typescript
const result = await runAI({
  mode: 'B2B_GENERATOR',
  userId: user.id,
  user: 'Empresas de varejo que precisam melhorar vendas online',
  context: 'Região: São Paulo, Setor: Varejo',
  metadata: { source: 'b2b_generator', category: 'E-commerce' }
});

// result.text: "Encontrar lojas de varejo em São Paulo sem vendas online 
//               ou com e-commerce básico e sem integração com estoque"
```

### Exemplo 2: Classificar Lead

```typescript
const result = await runAI({
  mode: 'CLASSIFICATION',
  userId: user.id,
  user: 'Classificar este lead: Empresa XYZ, faturamento R$ 5M/ano, 50 funcionários',
  system: 'Classifique em: PEQUENO, MÉDIO, GRANDE. Responda apenas a classificação.',
  metadata: { source: 'crm', leadId: '123' }
});

// result.text: "MÉDIO"
```

### Exemplo 3: Sugerir Próximo Passo CRM

```typescript
const result = await runAI({
  mode: 'CRM_ASSISTANT',
  userId: user.id,
  user: 'Lead qualificado há 3 dias, enviamos proposta mas sem resposta',
  context: 'Empresa: Tech Corp, Contato: João Silva, Email: joao@techcorp.com',
  metadata: { source: 'crm', companyId: '456' }
});

// result.text: "Enviar follow-up por WhatsApp ou ligar diretamente para 
//               João Silva perguntando se teve tempo de revisar a proposta"
```

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs em `ai_usage_logs`
2. Verificar console do backend (erros detalhados)
3. Testar endpoint: `curl http://localhost:3000/api/ai/run`

---

**Última atualização**: 29/11/2025  
**Versão da Camada**: 1.0.0  
**Status**: ✅ Produção (Beta)
