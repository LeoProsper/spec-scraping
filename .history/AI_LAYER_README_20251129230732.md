# 🤖 Camada de IA - SPEC64

## ✅ Status: Implementado e Funcional

A camada centralizada de IA foi criada e está pronta para uso. Todos os componentes foram implementados e testados.

## 📦 O que foi criado?

### 1. **Serviço Central de IA** (`lib/ai/openai.service.ts`)
- ✅ Função `runAI()` com retry automático e timeout
- ✅ Suporte a 6 modos diferentes (CHAT, B2B_GENERATOR, CRM_ASSISTANT, etc.)
- ✅ System prompts otimizados por modo
- ✅ Tratamento de erros robusto

### 2. **API Endpoint** (`/api/ai/run`)
- ✅ Autenticação obrigatória (Supabase Auth)
- ✅ Rate limiting (60 req/hora por usuário)
- ✅ Validação de parâmetros com Zod
- ✅ Logging automático de uso

### 3. **Banco de Dados**
- ✅ Tabela `ai_usage_logs` para rastreamento
- ✅ View `ai_usage_stats` para analytics
- ✅ Função `check_ai_rate_limit()` no Supabase

### 4. **Integração**
- ✅ Botão "Gerar com IA" na página de Oportunidades B2B
- ✅ Interface com feedback de rate limit
- ✅ Histórico salvo automaticamente

## 🚀 Como usar?

### Configuração Inicial (1 minuto)

1. **Adicionar OpenAI API Key**:
```bash
# Edite apps/web/.env.development ou .env.local
OPENAI_API_KEY=sk-proj-sua_chave_aqui
```

2. **Pronto!** O resto já está configurado.

### Testando a Integração

1. Acesse `http://localhost:3000/home/opportunities`
2. Selecione um nicho específico (ex: "Web & Digital")
3. Clique em **"Gerar com IA"**
4. Aguarde 2-5 segundos
5. Veja o prompt gerado pela IA

### Usando em Código (Backend)

```typescript
import { runAI } from '@/lib/ai/openai.service';

const result = await runAI({
  mode: 'B2B_GENERATOR',
  userId: user.id,
  user: 'Empresas de e-commerce sem mobile',
  context: 'Região: SP',
  metadata: { source: 'my_feature' }
});

console.log(result.text);
```

### Usando via API (Frontend)

```typescript
const response = await fetch('/api/ai/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'B2B_GENERATOR',
    user: 'Seu prompt aqui',
    metadata: { source: 'frontend' }
  })
});

const data = await response.json();
if (data.success) {
  console.log(data.result);
}
```

## 🔍 Monitoramento

### Ver logs de uso:
```sql
SELECT * FROM ai_usage_logs 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Ver estatísticas:
```sql
SELECT * FROM ai_usage_stats 
WHERE user_id = 'xxx';
```

### Verificar rate limit de um usuário:
```sql
SELECT check_ai_rate_limit('user-id', 60, 60);
```

## 🎯 Modos Disponíveis

| Modo | Uso | System Prompt |
|------|-----|---------------|
| `B2B_GENERATOR` | ✅ **Implementado** | Gerar oportunidades de prospecção B2B |
| `CHAT` | ⏳ Futuro | Chat genérico |
| `CRM_ASSISTANT` | ⏳ Futuro | Análise de leads e sugestões |
| `PROPOSAL_WRITER` | ⏳ Futuro | Geração de propostas comerciais |
| `EMAIL_OUTREACH` | ⏳ Futuro | Cold emails personalizados |
| `CLASSIFICATION` | ⏳ Futuro | Classificação de dados |

## 🛡️ Segurança

- ✅ API Key nunca exposta ao frontend
- ✅ Autenticação obrigatória
- ✅ Rate limiting por usuário
- ✅ RLS (Row Level Security) nos logs
- ✅ Validação de entrada com Zod

## 🚦 Rate Limiting

- **Desenvolvimento**: 60 requisições/hora (em memória)
- **Produção**: Migrar para Redis ou Supabase function

### Resetar rate limit (apenas dev):
```typescript
import { resetRateLimit } from '@/lib/ai/rate-limit';
resetRateLimit(userId);
```

## 📊 Custos Estimados

Com `gpt-4o-mini`:
- **Input**: ~$0.15 / 1M tokens
- **Output**: ~$0.60 / 1M tokens
- **Média**: ~200 tokens por prompt
- **Custo**: ~$0.0002 por prompt (R$ 0,001)

**100 usuários × 10 prompts/dia = R$ 1,00/dia = R$ 30/mês**

## 🔮 Próximos Passos

### Fase 1: Sistema de Créditos
```sql
ALTER TABLE accounts 
ADD COLUMN ai_credits_monthly INTEGER DEFAULT 100,
ADD COLUMN ai_credits_used INTEGER DEFAULT 0;
```

### Fase 2: Streaming para Chat
```typescript
const stream = await runAIStream({ mode: 'CHAT', ... });
for await (const chunk of stream) {
  console.log(chunk);
}
```

### Fase 3: Múltiplos Providers
```typescript
runAI({ 
  provider: 'openai' | 'anthropic' | 'google',
  mode: 'CHAT',
  ...
});
```

## 📚 Documentação Completa

Veja `docs/AI_LAYER_OVERVIEW.md` para documentação detalhada com:
- Guia completo de uso
- Todos os parâmetros da API
- Exemplos práticos
- Troubleshooting
- Queries SQL úteis

## 🐛 Troubleshooting Rápido

**Erro: "AI layer is not properly configured"**
→ Adicione `OPENAI_API_KEY` no `.env.local`

**Erro: "Rate limit exceeded"**
→ Aguarde 1 hora ou use `resetRateLimit()` em dev

**Erro: "AI request timed out"**
→ Reduza `maxTokens` ou aumente `OPENAI_TIMEOUT_MS`

**Performance lenta**
→ Use `gpt-4o-mini` ao invés de `gpt-4o`

---

**Implementado por**: GitHub Copilot  
**Data**: 29/11/2025  
**Status**: ✅ Pronto para Produção (Beta)
