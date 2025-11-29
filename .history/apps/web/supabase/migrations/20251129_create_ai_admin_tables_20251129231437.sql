-- =====================================================
-- MIGRATION: AI Admin Control Tables
-- Data: 29/11/2025
-- Descrição: Tabelas para controle administrativo da camada de IA
-- =====================================================

-- =====================================================
-- 1. TABELA: ai_settings
-- Configurações da OpenAI (API key, models, limites)
-- =====================================================

create table if not exists ai_settings (
  id uuid primary key default gen_random_uuid(),

  -- Provider configuration
  provider text not null default 'openai'
    check (provider in ('openai', 'anthropic', 'google', 'custom')),

  -- OpenAI credentials
  api_key text not null,
  api_base_url text not null default 'https://api.openai.com/v1',

  -- Model configuration
  model_default text not null default 'gpt-4o-mini',
  model_high text not null default 'gpt-4o',

  -- Generation parameters
  max_tokens integer not null default 1200
    check (max_tokens between 100 and 16000),
  timeout_ms integer not null default 45000
    check (timeout_ms between 5000 and 120000),
  temperature_default numeric(3,2) not null default 0.6
    check (temperature_default between 0.0 and 2.0),

  -- Control flags
  is_active boolean not null default true,

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Only one active config at a time
  constraint only_one_active unique (is_active) deferrable initially deferred
);

-- Index for active config lookup
create index if not exists idx_ai_settings_active on ai_settings(is_active) where is_active = true;

-- Trigger para updated_at
create or replace function update_ai_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_ai_settings_updated_at
  before update on ai_settings
  for each row
  execute function update_ai_settings_updated_at();

-- RLS Policies (apenas admins podem ver/editar)
alter table ai_settings enable row level security;

create policy "Admin can view ai_settings"
  on ai_settings for select
  using (
    exists (
      select 1 from accounts
      where accounts.id = auth.uid()
      and accounts.role = 'admin'
    )
  );

create policy "Admin can insert ai_settings"
  on ai_settings for insert
  with check (
    exists (
      select 1 from accounts
      where accounts.id = auth.uid()
      and accounts.role = 'admin'
    )
  );

create policy "Admin can update ai_settings"
  on ai_settings for update
  using (
    exists (
      select 1 from accounts
      where accounts.id = auth.uid()
      and accounts.role = 'admin'
    )
  );

-- =====================================================
-- 2. TABELA: ai_feature_flags
-- Controla onde a IA pode atuar no sistema
-- =====================================================

create table if not exists ai_feature_flags (
  id uuid primary key default gen_random_uuid(),

  -- Feature identifier
  feature text unique not null
    check (feature in (
      'CHAT_AI',
      'B2B_GENERATOR',
      'CRM_ASSISTANT',
      'PROPOSAL_WRITER',
      'EMAIL_OUTREACH',
      'CLASSIFICATION'
    )),

  -- Control
  is_enabled boolean not null default true,

  -- Metadata
  description text,
  max_calls_per_user_per_day integer default null, -- null = unlimited
  max_calls_per_minute integer default null, -- null = unlimited

  -- Audit
  updated_at timestamptz not null default now()
);

-- Index for feature lookup
create index if not exists idx_ai_feature_flags_feature on ai_feature_flags(feature);
create index if not exists idx_ai_feature_flags_enabled on ai_feature_flags(is_enabled);

-- Trigger para updated_at
create or replace function update_ai_feature_flags_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_ai_feature_flags_updated_at
  before update on ai_feature_flags
  for each row
  execute function update_ai_feature_flags_updated_at();

-- RLS Policies
alter table ai_feature_flags enable row level security;

create policy "Anyone can view ai_feature_flags"
  on ai_feature_flags for select
  using (true); -- Qualquer usuário autenticado pode ver (necessário para runAI)

create policy "Admin can update ai_feature_flags"
  on ai_feature_flags for update
  using (
    exists (
      select 1 from accounts
      where accounts.id = auth.uid()
      and accounts.role = 'admin'
    )
  );

-- Seed inicial
insert into ai_feature_flags (feature, description, max_calls_per_user_per_day, max_calls_per_minute) values
  ('CHAT_AI', 'Chat principal do sistema', null, 10),
  ('B2B_GENERATOR', 'Gerador de oportunidades B2B', 50, 5),
  ('CRM_ASSISTANT', 'IA assistente no CRM', null, 10),
  ('PROPOSAL_WRITER', 'IA para criação de propostas', 20, 3),
  ('EMAIL_OUTREACH', 'IA para emails de outreach', 100, 10),
  ('CLASSIFICATION', 'Classificação automática de leads', null, 20)
on conflict (feature) do nothing;

-- =====================================================
-- 3. TABELA: ai_usage_logs (NOVA - mais detalhada)
-- Substitui a tabela anterior com dados de custo
-- =====================================================

-- Drop old table if exists
drop table if exists ai_usage_logs cascade;

create table ai_usage_logs (
  id uuid primary key default gen_random_uuid(),

  -- User & feature
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null
    check (mode in (
      'CHAT',
      'B2B_GENERATOR',
      'CRM_ASSISTANT',
      'PROPOSAL_WRITER',
      'EMAIL_OUTREACH',
      'CLASSIFICATION'
    )),

  -- Token usage
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer generated always as (input_tokens + output_tokens) stored,

  -- Cost estimation (USD)
  cost_estimated numeric(10,6) not null default 0.0,

  -- Model used
  model_used text not null,

  -- Duration
  duration_ms integer,

  -- Status
  success boolean not null default true,
  error_code text,
  error_message text,

  -- Metadata
  metadata jsonb default '{}'::jsonb,

  -- Audit
  created_at timestamptz not null default now()
);

-- Indexes for analytics
create index if not exists idx_ai_usage_logs_user_id on ai_usage_logs(user_id);
create index if not exists idx_ai_usage_logs_mode on ai_usage_logs(mode);
create index if not exists idx_ai_usage_logs_created_at on ai_usage_logs(created_at desc);
create index if not exists idx_ai_usage_logs_user_created on ai_usage_logs(user_id, created_at desc);
create index if not exists idx_ai_usage_logs_success on ai_usage_logs(success);
create index if not exists idx_ai_usage_logs_cost on ai_usage_logs(cost_estimated desc);

-- GIN index for metadata queries
create index if not exists idx_ai_usage_logs_metadata on ai_usage_logs using gin(metadata);

-- RLS Policies
alter table ai_usage_logs enable row level security;

create policy "Users can view their own ai_usage_logs"
  on ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Admin can view all ai_usage_logs"
  on ai_usage_logs for select
  using (
    exists (
      select 1 from accounts
      where accounts.id = auth.uid()
      and accounts.role = 'admin'
    )
  );

create policy "Service role can insert ai_usage_logs"
  on ai_usage_logs for insert
  with check (true); -- API interna vai inserir

-- =====================================================
-- 4. VIEW: ai_usage_stats (Analytics)
-- =====================================================

create or replace view ai_usage_stats as
select
  user_id,
  mode,
  date_trunc('hour', created_at) as hour_bucket,
  date_trunc('day', created_at) as day_bucket,

  count(*) as total_requests,
  count(*) filter (where success) as successful_requests,
  count(*) filter (where not success) as failed_requests,

  sum(input_tokens) as total_input_tokens,
  sum(output_tokens) as total_output_tokens,
  sum(total_tokens) as total_tokens,

  sum(cost_estimated) as total_cost,
  avg(cost_estimated) as avg_cost_per_request,

  avg(duration_ms) filter (where duration_ms is not null) as avg_duration_ms,

  max(created_at) as last_used_at
from ai_usage_logs
group by user_id, mode, hour_bucket, day_bucket;

-- =====================================================
-- 5. VIEW: ai_daily_cost (Custo diário)
-- =====================================================

create or replace view ai_daily_cost as
select
  date_trunc('day', created_at) as day,
  mode,
  count(*) as requests,
  sum(total_tokens) as total_tokens,
  sum(cost_estimated) as total_cost
from ai_usage_logs
where success = true
group by day, mode
order by day desc;

-- =====================================================
-- 6. VIEW: ai_top_users (Ranking de usuários)
-- =====================================================

create or replace view ai_top_users as
select
  user_id,
  count(*) as total_requests,
  sum(total_tokens) as total_tokens,
  sum(cost_estimated) as total_cost,
  max(created_at) as last_used_at
from ai_usage_logs
where success = true
group by user_id
order by total_cost desc;

-- =====================================================
-- 7. FUNCTION: check_ai_feature_enabled
-- =====================================================

create or replace function check_ai_feature_enabled(p_feature text)
returns boolean as $$
declare
  v_enabled boolean;
begin
  select is_enabled into v_enabled
  from ai_feature_flags
  where feature = p_feature;

  return coalesce(v_enabled, false);
end;
$$ language plpgsql security definer;

-- =====================================================
-- 8. FUNCTION: get_active_ai_config
-- =====================================================

create or replace function get_active_ai_config()
returns table (
  provider text,
  api_key text,
  api_base_url text,
  model_default text,
  model_high text,
  max_tokens integer,
  timeout_ms integer,
  temperature_default numeric
) as $$
begin
  return query
  select
    s.provider,
    s.api_key,
    s.api_base_url,
    s.model_default,
    s.model_high,
    s.max_tokens,
    s.timeout_ms,
    s.temperature_default
  from ai_settings s
  where s.is_active = true
  limit 1;
end;
$$ language plpgsql security definer;

-- =====================================================
-- 9. FUNCTION: mask_api_key (segurança)
-- =====================================================

create or replace function mask_api_key(p_api_key text)
returns text as $$
begin
  if p_api_key is null or length(p_api_key) < 8 then
    return '****';
  end if;

  return 'sk-****' || right(p_api_key, 4);
end;
$$ language plpgsql immutable;

-- =====================================================
-- 10. COMENTÁRIOS (Documentação)
-- =====================================================

comment on table ai_settings is 'Configurações da OpenAI (API key, models, limites). Apenas admins podem editar.';
comment on table ai_feature_flags is 'Flags para ativar/desativar módulos de IA no sistema.';
comment on table ai_usage_logs is 'Logs detalhados de uso da IA com cálculo de custo.';
comment on view ai_usage_stats is 'Estatísticas agregadas de uso da IA por hora/dia.';
comment on view ai_daily_cost is 'Custo diário da IA por modo.';
comment on view ai_top_users is 'Ranking de usuários que mais usam IA (por custo).';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
