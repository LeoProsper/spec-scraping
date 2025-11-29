-- =====================================================
-- FIX: Adicionar coluna role e corrigir policies
-- =====================================================

-- 1. Adicionar coluna role em accounts
alter table accounts 
add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

-- 2. Criar index para role
create index if not exists idx_accounts_role on accounts(role);

-- 3. Definir um admin (você)
update accounts 
set role = 'admin' 
where email = 'lelevitormkt@gmail.com';

-- 4. Recriar policies de ai_settings com role correto
drop policy if exists "Admin can view ai_settings" on ai_settings;
drop policy if exists "Admin can insert ai_settings" on ai_settings;
drop policy if exists "Admin can update ai_settings" on ai_settings;

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

-- 5. Recriar policy de ai_feature_flags
drop policy if exists "Admin can update ai_feature_flags" on ai_feature_flags;

create policy "Admin can update ai_feature_flags"
  on ai_feature_flags for update
  using (
    exists (
      select 1 from accounts
      where accounts.id = auth.uid()
      and accounts.role = 'admin'
    )
  );

-- 6. Recriar policy de ai_usage_logs
drop policy if exists "Admin can view all ai_usage_logs" on ai_usage_logs;

create policy "Admin can view all ai_usage_logs"
  on ai_usage_logs for select
  using (
    exists (
      select 1 from accounts
      where accounts.id = auth.uid()
      and accounts.role = 'admin'
    )
  );

-- 7. Recriar view ai_usage_stats (foi dropada em cascata)
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
-- FIM DO FIX
-- =====================================================
