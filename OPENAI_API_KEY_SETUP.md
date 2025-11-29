# 🔑 Como Obter sua OpenAI API Key

## Passo a Passo

### 1. Criar Conta na OpenAI

1. Acesse: https://platform.openai.com/signup
2. Crie uma conta com seu email
3. Confirme seu email

### 2. Adicionar Método de Pagamento

1. Acesse: https://platform.openai.com/account/billing/overview
2. Clique em "Add payment method"
3. Adicione um cartão de crédito
4. **Importante**: Defina um limite de gasto mensal (ex: $5-10/mês)

### 3. Criar API Key

1. Acesse: https://platform.openai.com/api-keys
2. Clique em **"Create new secret key"**
3. Dê um nome (ex: "SPEC64 Development")
4. **Copie e salve** a chave (ela só aparece uma vez!)
5. Formato: `sk-proj-...` (começa com `sk-proj-`)

### 4. Configurar no Projeto

Abra o arquivo `apps/web/.env.local` (ou `.env.development`) e adicione:

```env
OPENAI_API_KEY=sk-proj-sua_chave_aqui
```

### 5. Testar

Reinicie o servidor Next.js e teste:

```bash
# No terminal do projeto
pnpm run dev --filter web
```

Acesse: http://localhost:3000/home/opportunities e clique em "Gerar com IA"

## 💰 Custos

### Modelo: gpt-4o-mini (Recomendado)

- **Input**: $0.15 / 1M tokens
- **Output**: $0.60 / 1M tokens
- **Média por prompt**: ~200 tokens = $0.0002 (R$ 0,001)

### Exemplo de uso:

- 100 usuários
- 10 prompts por dia cada
- = 1000 prompts/dia
- = **$0.20/dia** = **$6/mês** (R$ 30/mês)

### Modelo: gpt-4o (Mais Caro)

- **Input**: $2.50 / 1M tokens
- **Output**: $10.00 / 1M tokens
- ~17x mais caro que gpt-4o-mini

**💡 Recomendação**: Use `gpt-4o-mini` para desenvolvimento. É mais rápido e muito mais barato.

## 🛡️ Segurança

### ✅ O que fazer:

- Adicione a chave no `.env.local` (nunca no código)
- Adicione `.env.local` ao `.gitignore`
- Defina limite de gasto mensal na OpenAI
- Use rate limiting (já implementado: 60 req/hora)

### ❌ NUNCA faça:

- Commitar `.env.local` no Git
- Expor a API key no frontend
- Compartilhar a chave publicamente
- Deixar sem limite de gasto

## 📊 Monitorar Uso

### No Dashboard da OpenAI:

1. Acesse: https://platform.openai.com/usage
2. Veja uso por dia/mês
3. Configure alertas de gasto

### No SPEC64:

```sql
-- Ver total de tokens usados
SELECT 
  SUM(tokens_used) as total_tokens,
  COUNT(*) as total_requests
FROM ai_usage_logs
WHERE created_at >= date_trunc('month', now());

-- Ver custo estimado (gpt-4o-mini)
SELECT 
  SUM(tokens_used) * 0.00000015 as custo_usd_estimado
FROM ai_usage_logs
WHERE created_at >= date_trunc('month', now());
```

## 🚨 Se a Chave Vazar

1. **Revogue imediatamente**: https://platform.openai.com/api-keys
2. Crie uma nova chave
3. Atualize no `.env.local`
4. Verifique o uso no dashboard da OpenAI

## 💳 Créditos Gratuitos

Novas contas da OpenAI geralmente recebem **$5 em créditos gratuitos** que expiram em 3 meses. Isso é suficiente para:

- ~25.000 prompts com gpt-4o-mini
- Ou ~1.500 prompts com gpt-4o

## 🎓 Alternativas para Teste

### 1. Sem OpenAI (apenas prompts aleatórios)

Deixe `OPENAI_API_KEY` vazio e use apenas o botão "Buscar Oportunidade" (não usa IA).

### 2. Usar Mock (desenvolvimento)

```typescript
// lib/ai/openai.service.ts
// Adicione no início da função runAI():

if (process.env.USE_MOCK_AI === 'true') {
  await sleep(2000); // Simula delay
  return {
    text: `Mock: Encontrar ${params.user.substring(0, 50)}...`,
    raw: null
  };
}
```

Então no `.env.local`:
```env
USE_MOCK_AI=true
```

## 📞 Suporte

### Documentação OpenAI:
- API Reference: https://platform.openai.com/docs/api-reference
- Rate Limits: https://platform.openai.com/docs/guides/rate-limits
- Error Codes: https://platform.openai.com/docs/guides/error-codes

### SPEC64 AI Layer:
- Veja `AI_LAYER_README.md` para guia rápido
- Veja `docs/AI_LAYER_OVERVIEW.md` para documentação completa

---

**Última atualização**: 29/11/2025
