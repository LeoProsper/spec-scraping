# ✅ FASES 4 & 5 - SCORING AUTOMÁTICO + ALERTAS VISUAIS

**Status**: ✅ CONCLUÍDO  
**Data**: 29/11/2025

---

## 🎯 FASE 4: Prioridade Automática de Leads (Scoring)

### Objetivo
Calcular automaticamente um **score de 0 a 100** para cada lead baseado em critérios estratégicos, permitindo ordenação inteligente e foco nos leads mais promissores.

### Sistema de Pontuação

| Critério | Pontos | Descrição |
|----------|--------|-----------|
| ✅ Sem site | +20 | Empresa sem presença digital |
| ✅ Avaliação < 3.5 | +20 | Reputação ruim no Google |
| ✅ Reviews < 15 | +15 | Pouca visibilidade/concorrência |
| ✅ Interação recente (7 dias) | +15 | Lead engajado recentemente |
| ✅ Sem interação > 14 dias | +10 | Lead esquecido que precisa atenção |
| ✅ Categoria estratégica | +20 | Setor prioritário do negócio |

**Total máximo**: 100 pontos

### Níveis de Prioridade

```typescript
Alta:   60-100 pontos → Badge vermelho 🔥
Média:  30-59 pontos  → Badge amarelo ⚡
Baixa:  0-29 pontos   → Badge verde ✅
```

### Categorias Estratégicas

Configuradas na função SQL (ajustáveis por negócio):
- Restaurante
- Clínica médica
- Academia
- Hotel
- Loja de roupas
- Salão de beleza
- Dentista
- Advocacia

---

## 📊 Implementação Técnica

### 1. Banco de Dados

**Colunas adicionadas:**
```sql
ALTER TABLE companies
ADD COLUMN priority_score INTEGER DEFAULT 0,
ADD COLUMN priority_level TEXT DEFAULT 'baixa';
```

**Função de cálculo:**
```sql
CREATE FUNCTION calculate_lead_priority(p_company_id UUID)
RETURNS TABLE(score INTEGER, level TEXT)
```

**Trigger automático:**
```sql
CREATE TRIGGER trigger_update_company_priority
  BEFORE INSERT OR UPDATE OF website, rating, total_reviews, lead_status, category
  ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_priority();
```

### 2. API

**Ordenação padrão alterada:**
```typescript
const sortBy = searchParams.get('sortBy') || 'priority_score'; // ← MUDANÇA
const sortOrder = searchParams.get('sortOrder') || 'desc';
```

Agora a tabela ordena por **prioridade por padrão**, mostrando leads mais importantes primeiro.

### 3. Interface

**Nova coluna na tabela:**
```tsx
<TableHead className="text-center">🔢 Prioridade</TableHead>
```

**Badge colorido:**
```tsx
<Badge className={
  priority_level === 'alta' ? 'bg-red-100 text-red-800 font-semibold' :
  priority_level === 'media' ? 'bg-yellow-100 text-yellow-800' :
  'bg-green-100 text-green-800'
}>
  {priority_level === 'alta' ? '🔥 Alta' : 
   priority_level === 'media' ? '⚡ Média' : 
   '✅ Baixa'}
</Badge>
<div className="text-xs text-muted-foreground mt-1">
  {priority_score} pts
</div>
```

---

## 🚨 FASE 5: Alertas Visuais na Tabela

### Objetivo
Adicionar **badges de alerta** diretamente na coluna Status para destacar situações urgentes que exigem ação imediata.

### 3 Tipos de Alertas

#### 1. 💥 Follow-up Vencido (Badge Vermelho)
- **Trigger**: `followup_vencido === true`
- **Cor**: Vermelho (`variant="destructive"`)
- **Texto**: "💥 Follow-up vencido"
- **Ação sugerida**: Reagendar ação imediatamente

#### 2. ⚡ Lead Quente (Badge Laranja)
- **Trigger**: `is_hot_lead === true`
- **Cor**: Laranja (`bg-orange-500`)
- **Texto**: "⚡ Lead quente"
- **Ação sugerida**: Priorizar contato/proposta

#### 3. 🧊 Lead Parado (Badge Azul)
- **Trigger**: `dias_sem_interacao > 14`
- **Cor**: Azul (`bg-blue-500`)
- **Texto**: "🧊 Lead parado"
- **Ação sugerida**: Reativar relacionamento

### Implementação

```tsx
<TableCell>
  <div className="flex flex-col gap-1">
    {/* Status principal */}
    <Badge variant="secondary" className={LEAD_STATUS_COLORS[lead_status]}>
      {LEAD_STATUS_LABELS[lead_status]}
    </Badge>
    
    {/* Badges de alerta */}
    <div className="flex flex-wrap gap-1">
      {followup_vencido && (
        <Badge variant="destructive" className="text-xs">
          💥 Follow-up vencido
        </Badge>
      )}
      {is_hot_lead && (
        <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
          ⚡ Lead quente
        </Badge>
      )}
      {dias_sem_interacao > 14 && (
        <Badge className="text-xs bg-blue-500 hover:bg-blue-600">
          🧊 Lead parado
        </Badge>
      )}
    </div>
  </div>
</TableCell>
```

---

## 📁 Arquivos Criados/Modificados

### ✅ Novos arquivos

**`20251129_add_lead_priority_scoring.sql`** (MIGRATION)
- Adiciona colunas `priority_score` e `priority_level`
- Cria função `calculate_lead_priority()`
- Cria trigger automático para recálculo
- Atualiza empresas existentes

### ✅ Arquivos modificados

**`route.ts` (API /api/companies/master)**
- Alterada ordenação padrão: `sortBy = 'priority_score'`
- Empresas aparecem ordenadas por prioridade automáticamente

**`master-crm-table.tsx`**
- Adicionada coluna "🔢 Prioridade"
- Badge colorido (Alta/Média/Baixa) com pontuação
- 3 badges de alerta visual na coluna Status
- Interface Company estendida com `priority_score` e `priority_level`

---

## 🎯 Benefícios

### FASE 4 (Scoring)
1. ✅ **Foco automatizado**: Leads mais importantes aparecem primeiro
2. ✅ **Critério objetivo**: Score baseado em dados, não intuição
3. ✅ **Atualização automática**: Recalcula ao alterar dados relevantes
4. ✅ **Transparência**: Pontuação visível para justificar prioridade

### FASE 5 (Alertas)
1. ✅ **Urgência visual**: Situações críticas destacadas
2. ✅ **Ação clara**: Cada badge sugere o que fazer
3. ✅ **Prevenção**: Evita leads perdidos por esquecimento
4. ✅ **Eficiência**: Menos tempo procurando, mais tempo agindo

---

## 📊 Exemplo de Cálculo

### Empresa: "Restaurante Sem Site Ltda"

```
✅ Sem site               → +20 pontos
✅ Avaliação 3.2          → +20 pontos (< 3.5)
✅ 8 reviews              → +15 pontos (< 15)
❌ Interação há 2 dias    → +0 pontos (< 7 dias, mas não qualifica)
✅ Sem interação há 20d   → +10 pontos (> 14 dias)
✅ Categoria: Restaurante → +20 pontos (estratégica)
─────────────────────────────────────────
TOTAL: 85 pontos → 🔥 ALTA PRIORIDADE
```

### Status na Tabela

```
┌─────────────────────────────────────────┐
│ Status: Qualificado (roxo)              │
│                                          │
│ Alertas:                                 │
│ 🧊 Lead parado (sem contato há 20 dias) │
│ ⚡ Lead quente (interação recente)      │
│                                          │
│ Prioridade: 🔥 Alta (85 pts)            │
└─────────────────────────────────────────┘
```

**Ação recomendada**: Contato imediato para proposta de criação de site e gestão de reputação online.

---

## 🔧 Categorias Estratégicas (Personalizáveis)

Edite a função SQL para ajustar ao seu negócio:

```sql
strategic_categories TEXT[] := ARRAY[
  'Restaurante',
  'Clínica médica',
  'Academia',
  -- Adicione suas categorias aqui
];
```

---

## ✅ Validação

### Testes necessários
1. ✅ Verificar prioridade calculada corretamente
2. ✅ Verificar ordenação automática por prioridade
3. ✅ Verificar badge colorido (Alta/Média/Baixa)
4. ✅ Verificar 3 tipos de alertas visuais
5. ✅ Verificar trigger automático ao atualizar dados

### Casos de teste

| Cenário | Score Esperado | Nível | Alertas |
|---------|----------------|-------|---------|
| Restaurante sem site, 10 reviews, rating 3.0 | 75 | Alta | 🧊 (se > 14 dias) |
| Hotel com site, 50 reviews, rating 4.5 | 20-35 | Baixa/Média | - |
| Academia sem site, sem interação 20 dias | 50-70 | Média/Alta | 🧊 |
| Lead com follow-up vencido | Variável | Variável | 💥 |
| Lead qualificado com interação há 2 dias | Variável | Variável | ⚡ |

---

## 🚀 Próximos Passos (Sugeridos)

1. **Dashboard de Prioridades**
   - Gráfico: distribuição Alta/Média/Baixa
   - KPI: Score médio da carteira
   - Alertas: quantos follow-ups vencidos

2. **Histórico de Score**
   - Tabela: score_history(company_id, score, calculated_at)
   - Gráfico: evolução da prioridade ao longo do tempo

3. **Ações Automatizadas**
   - Lead Alta + parado > 14 dias → enviar email automático
   - Follow-up vencido → notificação push
   - Lead quente + sem proposta → sugerir criar proposta

4. **Machine Learning (Futuro)**
   - Treinar modelo com histórico de conversões
   - Ajustar pesos automaticamente
   - Prever probabilidade de fechamento

---

**Resultado Final**: Sistema inteligente que **prioriza automaticamente** os leads mais promissores e **alerta visualmente** sobre situações que exigem ação imediata, aumentando eficiência e taxa de conversão. ✅
