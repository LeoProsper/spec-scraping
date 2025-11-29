# ✅ FASE PRODUTO V1 — Sistema Operacional Fechado

**Data:** 29/11/2025  
**Status:** ✅ COMPLETO  
**Autor:** GitHub Copilot + Leo

---

## 🎯 OBJETIVO GERAL

Transformar o spec64 em um **PRODUTO OPERACIONAL FECHADO** com ciclo completo:
**Entrada (Chat AI) → Organização (CRM/Listas) → Ação (Contato) → Exportação (CSV) → Venda**

---

## ✅ FASE P1 — PIPELINE FECHADO (CHAT AI → CRM → LISTA)

### Objetivo
Criar fluxo obrigatório onde usuário cria leads via Chat AI e eles aparecem automaticamente no CRM com scoring e lista.

### Implementação

#### 1. Migration + Função SQL
**Arquivo:** `apps/web/supabase/migrations/20251129_fase_p_produto_v1.sql`

**Tabelas criadas:**
- `product_events` - Telemetria de uso
- Campo `onboarding_progress` em `accounts`

**Função SQL:** `criar_lead_via_chat()`
```sql
-- Entrada:
- p_user_id (UUID)
- p_nome (TEXT)
- p_cidade (TEXT)
- p_categoria (TEXT)
- p_telefone (TEXT opcional)
- p_website (TEXT opcional)
- p_instagram (TEXT opcional)

-- O que faz:
1. Busca account_id do usuário
2. Cria ou busca lista "Leads via Chat AI — {data}"
3. Insere empresa em companies
4. Adiciona empresa à lista
5. Registra evento de telemetria
6. Atualiza onboarding_progress
```

#### 2. API de Criação
**Arquivo:** `apps/web/app/api/companies/create-via-chat/route.ts`

**Endpoint:** `POST /api/companies/create-via-chat`

**Body:**
```json
{
  "nome": "Restaurante do João",
  "cidade": "São Paulo",
  "categoria": "Restaurante",
  "telefone": "(11) 99999-9999", // opcional
  "website": "https://...", // opcional
  "instagram": "@...", // opcional
}
```

**Retorno:**
```json
{
  "success": true,
  "data": {
    "company_id": "uuid",
    "list_id": "uuid",
    "list_name": "Leads via Chat AI — 29/11/2025",
    "message": "Lead criado com sucesso!"
  }
}
```

**Fluxo automático:**
✅ Cria empresa com `lead_status = 'novo'`  
✅ Aplica scoring automaticamente (trigger)  
✅ Adiciona à lista do dia  
✅ Registra telemetria `lead_criado_via_chat`  
✅ Atualiza `onboarding_progress.first_lead_created = true`

### Resultado
- Lead criado via Chat AI cai automaticamente no CRM
- Aparece na lista "Leads via Chat AI — {data}"
- Já tem prioridade e scoring calculados

---

## ✅ FASE P2 — ONBOARDING "PRIMEIRO LEAD EM 2 MINUTOS"

### Objetivo
Guiar usuário na criação do primeiro lead com experiência zero-to-hero.

### Implementação

**Arquivo:** `apps/web/app/home/crm/_components/onboarding-first-lead.tsx`

**Componente:** `OnboardingFirstLead`

**Comportamento:**
- Exibe apenas quando `hasCompanies = false`
- 2 cards explicativos:
  1. **Card Azul** → "Crie seu primeiro lead" (botão abre Chat AI)
  2. **Card Verde** → "Veja tudo organizado" (explica o CRM)
- Botão "Já sei como funciona" → dismisses e salva em localStorage
- Redirecionamento automático ao Chat AI

**Integração:**
```tsx
// apps/web/app/home/crm/page.tsx
<OnboardingFirstLead hasCompanies={false} />
```

### Resultado
- Usuário novo vê onboarding ao entrar no CRM
- Clica em "Abrir Chat AI" → cria primeiro lead
- Lead aparece automaticamente no CRM

---

## ✅ FASE P3 — LISTAS COMO PRODUTO (ATIVO PRINCIPAL)

### Objetivo
Listas agora são o **CORE** do produto, não um extra.

### Funcionalidades Implementadas

#### 1. Menu de Ações de Lista
**Arquivo:** `apps/web/app/home/lists/_components/list-actions-menu.tsx`

**Componente:** `ListActionsMenu`

**Ações disponíveis:**
- 📥 **Exportar CSV** → Baixa CSV apenas dessa lista
- 📋 **Duplicar Lista** → Cria cópia com todas as empresas
- 🌐 **Tornar Pública/Privada** → Alterna visibilidade

#### 2. APIs de Gerenciamento

**Duplicar Lista:**
`POST /api/lists/duplicate`
```json
{ "listId": "uuid" }
```
- Cria nova lista "{nome} (cópia)"
- Copia todas as empresas
- Registra telemetria `lista_duplicada`

**Tornar Pública/Privada:**
`PATCH /api/lists/toggle-public`
```json
{ 
  "listId": "uuid",
  "isPublic": true 
}
```
- Alterna campo `is_public`
- Registra telemetria `lista_tornada_publica`

### Resultado
- Listas agora têm ações comerciais
- Usuário pode duplicar listas para diferentes campanhas
- Listas públicas podem ser compartilhadas com time

---

## ✅ FASE P4 — EXPORTAÇÃO (VALOR TANGÍVEL)

### Objetivo
**Sem exportação → sem SaaS.** Usuário precisa levar dados para fora.

### Implementação

#### 1. API de Exportação
**Arquivo:** `apps/web/app/api/companies/export-csv/route.ts`

**Endpoint:** `GET /api/companies/export-csv`

**Query Params:**
```
?listId=uuid          // Exportar lista específica
?leadStatus=qualificado  // Filtrar por status
?category=Restaurante    // Filtrar por categoria
?city=São Paulo         // Filtrar por cidade
```

**Formato CSV:**
```csv
Empresa,Telefone,Cidade,Estado,Categoria,Website,Avaliação,Total Reviews,Status,Prioridade,Score,Última Interação
"Restaurante do João","(11) 99999-9999","São Paulo","SP","Restaurante","https://...","4.5","120","qualificado","alta","85","29/11/2025"
```

**Telemetria:**
- Registra evento `exportacao_realizada`
- Atualiza `onboarding_progress.first_export_done = true`

#### 2. Botão de Exportação no CRM
**Arquivo:** `apps/web/app/home/crm/_components/crm-export-button.tsx`

**Componente:** `CrmExportButton`

**Localização:**
- PageHeader do CRM Master (canto superior direito)
- Respeita filtros ativos da tabela
- Mostra estado "Exportando..."

#### 3. Exportação por Lista
**Componente:** `ListActionsMenu` (já coberto na FASE P3)

### Resultado
- Usuário pode exportar CRM completo ou lista específica
- CSV com encoding UTF-8 BOM (abre corretamente no Excel)
- Telemetria de uso registrada

---

## ✅ FASE P5 — AÇÃO IMEDIATA (TRANSFORMA DADO EM VENDA)

### Objetivo
Lead → 1 clique → contato real (WhatsApp, Ligação, E-mail).

### Implementação

**Arquivo:** `apps/web/app/home/crm/_components/master-crm-table.tsx`

**Nova coluna:** ⚡ Contato

**3 botões de ação:**

1. **💬 WhatsApp**
   - Aparece se `company.phone` existe
   - Abre `https://wa.me/{telefone_limpo}`
   - Registra telemetria `contato_whatsapp_clicado`
   - Atualiza `onboarding_progress.first_whatsapp_clicked = true`

2. **📞 Ligar**
   - Aparece se `company.phone` existe
   - Abre `tel:{telefone}`
   - Funciona em mobile

3. **✉️ E-mail**
   - Aparece se `company.website` existe
   - Abre `mailto:contato@{dominio}`
   - Extrai domínio automaticamente

**Tooltip:**
- Cada botão tem tooltip explicativo
- Aparece ao hover

### Código de Exemplo

```tsx
<Button
  onClick={async () => {
    const phoneClean = company.phone?.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneClean}`, '_blank');
    
    // Telemetria
    await fetch('/api/telemetry/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento: 'contato_whatsapp_clicado',
        company_id: company.company_id,
      }),
    });
  }}
>
  <MessageSquare className="h-4 w-4" />
</Button>
```

### Resultado
- Usuário clica em WhatsApp → conversa abre instantaneamente
- 0 atrito entre lead e ação comercial
- Telemetria rastreia quais leads foram contatados

---

## ✅ FASE P6 — TELEMETRIA DE USO (MÉTRICAS DE PRODUTO)

### Objetivo
Rastrear eventos críticos para entender uso do produto.

### Implementação

#### 1. Tabela de Eventos
**Migration:** `20251129_fase_p_produto_v1.sql`

**Tabela:** `product_events`

**Schema:**
```sql
CREATE TABLE product_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  evento TEXT NOT NULL,
  company_id UUID,
  list_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_product_events_user_id`
- `idx_product_events_evento`
- `idx_product_events_created_at`

**RLS:**
- Users só veem seus próprios eventos

#### 2. API de Telemetria
**Arquivo:** `apps/web/app/api/telemetry/track/route.ts`

**Endpoint:** `POST /api/telemetry/track`

**Body:**
```json
{
  "evento": "lead_criado_via_chat",
  "company_id": "uuid", // opcional
  "list_id": "uuid", // opcional
  "metadata": { // opcional
    "nome": "Restaurante do João",
    "tem_telefone": true
  }
}
```

#### 3. Eventos Rastreados

| Evento | Quando Dispara | Metadata |
|--------|----------------|----------|
| `lead_criado_via_chat` | Criar empresa via Chat AI | nome, cidade, categoria |
| `lista_criada` | Criar nova lista | nome, is_public |
| `lista_duplicada` | Duplicar lista | lista_original_id, total_empresas |
| `lista_tornada_publica` | Tornar lista pública | - |
| `lista_tornada_privada` | Tornar lista privada | - |
| `lista_exportada` | Exportar lista para CSV | - |
| `exportacao_realizada` | Exportar CRM para CSV | total_exportado, filtros |
| `contato_whatsapp_clicado` | Clicar em botão WhatsApp | company_id |
| `proposta_criada` | Criar proposta | company_id |

#### 4. View de Métricas
**View:** `product_metrics_daily`

```sql
CREATE VIEW product_metrics_daily AS
SELECT 
  user_id,
  DATE(created_at) AS dia,
  evento,
  COUNT(*) AS total
FROM product_events
GROUP BY user_id, DATE(created_at), evento;
```

### Resultado
- Todos os eventos críticos são rastreados
- Possível analisar comportamento do usuário
- Base para analytics e billing futuro

---

## ✅ PROIBIÇÕES (O QUE NÃO FOI FEITO)

❌ Kaix Scout (módulo desativado)  
❌ Scraping automático externo  
❌ LinkedIn  
❌ Pagamentos  
❌ IA generativa pesada  
❌ Marketplace pago  
❌ Mudanças visuais drásticas

---

## 📊 RESULTADO FINAL

### Ciclo de Produto Completo

```
1. ENTRADA
   ↓ Chat AI → Criar lead
   ↓ /api/companies/create-via-chat

2. ORGANIZAÇÃO
   ↓ Lead cai no CRM Master
   ↓ Entra na lista "Leads via Chat AI — {data}"
   ↓ Scoring automático aplicado

3. AÇÃO
   ↓ Botões de contato visíveis (WhatsApp, Ligar, E-mail)
   ↓ 1 clique → ação real

4. EXPORTAÇÃO
   ↓ Exportar CRM ou lista para CSV
   ↓ Dados saem do sistema

5. VENDA
   ↓ Usuário fecha negócio fora do sistema
   ↓ Retorna e marca como "ganho"
```

### Métricas de Sucesso

**Onboarding:**
- [ ] `first_lead_created` → Criou primeiro lead
- [ ] `first_list_created` → Criou primeira lista
- [ ] `first_export_done` → Exportou pela primeira vez
- [ ] `first_whatsapp_clicked` → Clicou em WhatsApp

**Engajamento:**
- Total de leads criados via Chat AI por dia
- Total de exportações por semana
- Total de cliques em WhatsApp por dia
- Taxa de conversão (leads → ganho)

---

## 📁 Arquivos Criados/Modificados

### Backend (APIs)
1. `apps/web/app/api/companies/create-via-chat/route.ts` (novo)
2. `apps/web/app/api/companies/export-csv/route.ts` (novo)
3. `apps/web/app/api/telemetry/track/route.ts` (novo)
4. `apps/web/app/api/lists/duplicate/route.ts` (novo)
5. `apps/web/app/api/lists/toggle-public/route.ts` (novo)

### Frontend (Componentes)
1. `apps/web/app/home/crm/_components/onboarding-first-lead.tsx` (novo)
2. `apps/web/app/home/crm/_components/crm-export-button.tsx` (novo)
3. `apps/web/app/home/lists/_components/list-actions-menu.tsx` (novo)
4. `apps/web/app/home/crm/_components/master-crm-table.tsx` (modificado - coluna de contato)
5. `apps/web/app/home/crm/page.tsx` (modificado - onboarding + botão exportar)

### Database
1. `apps/web/supabase/migrations/20251129_fase_p_produto_v1.sql` (novo)
   - Tabela `product_events`
   - Campo `onboarding_progress`
   - Função `criar_lead_via_chat()`
   - View `product_metrics_daily`

### Documentação
1. `FASE_P_PRODUTO_V1.md` (este arquivo)

---

## 🚀 Como Usar

### 1. Aplicar Migration
```bash
docker exec supabase_db_next-supabase-saas-kit-turbo-lite psql -U postgres -d postgres -f /tmp/20251129_fase_p_produto_v1.sql
```

### 2. Criar Primeiro Lead via Chat AI
```typescript
const response = await fetch('/api/companies/create-via-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Restaurante do João',
    cidade: 'São Paulo',
    categoria: 'Restaurante',
    telefone: '(11) 99999-9999',
  }),
});
```

### 3. Exportar CRM
```typescript
// Respeitando filtros ativos
window.location.href = '/api/companies/export-csv?leadStatus=qualificado';
```

### 4. Registrar Telemetria
```typescript
await fetch('/api/telemetry/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    evento: 'contato_whatsapp_clicado',
    company_id: 'uuid',
  }),
});
```

---

## 🎉 CONCLUSÃO

O spec64 agora é um **PRODUTO FECHADO E OPERACIONAL**:

✅ Entrada via Chat AI  
✅ Organização automática no CRM  
✅ Ações de contato imediatas  
✅ Exportação para CSV  
✅ Telemetria completa  

**Próximos passos sugeridos:**
- Billing (cobrar por leads criados ou exportações)
- Dashboard de analytics (métricas do product_events)
- Automações de follow-up
- Integração com CRMs externos (HubSpot, Pipedrive)

**Este é um SaaS vendável já.**
