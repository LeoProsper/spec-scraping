-- Migration: Create AI Usage Logs Table
-- Description: Tracks AI API usage per user for monitoring, billing, and rate limiting
-- Created: 2025-11-29

-- Create ai_usage_logs table
create table if not exists public.ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- AI execution details
  mode text not null check (mode in ('CHAT', 'B2B_GENERATOR', 'CRM_ASSISTANT', 'PROPOSAL_WRITER', 'EMAIL_OUTREACH', 'CLASSIFICATION')),
  
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  
  -- Usage tracking
  tokens_used integer,
  tokens_estimated integer,
  
  -- Performance tracking
  duration_ms integer,
  
  -- Status
  success boolean not null default true,
  error_code text,
  error_message text,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists ai_usage_logs_user_id_idx on public.ai_usage_logs(user_id);
create index if not exists ai_usage_logs_mode_idx on public.ai_usage_logs(mode);
create index if not exists ai_usage_logs_created_at_idx on public.ai_usage_logs(created_at desc);
create index if not exists ai_usage_logs_user_created_idx on public.ai_usage_logs(user_id, created_at desc);
create index if not exists ai_usage_logs_metadata_idx on public.ai_usage_logs using gin(metadata);

-- Enable RLS
alter table public.ai_usage_logs enable row level security;

-- RLS Policies

-- Users can view their own logs
create policy "Users can view own AI usage logs"
  on public.ai_usage_logs
  for select
  using (auth.uid() = user_id);

-- Service role can insert logs (for API)
create policy "Service role can insert AI usage logs"
  on public.ai_usage_logs
  for insert
  with check (true);

-- Comment on table
comment on table public.ai_usage_logs is 'Tracks AI API usage for monitoring, analytics, and future billing';

-- Comment on columns
comment on column public.ai_usage_logs.mode is 'AI mode used: CHAT, B2B_GENERATOR, CRM_ASSISTANT, PROPOSAL_WRITER, EMAIL_OUTREACH, CLASSIFICATION';
comment on column public.ai_usage_logs.metadata is 'Additional context: source, category, listId, companyId, etc.';
comment on column public.ai_usage_logs.tokens_used is 'Actual tokens consumed from OpenAI response';
comment on column public.ai_usage_logs.tokens_estimated is 'Estimated tokens (if actual not available)';
comment on column public.ai_usage_logs.duration_ms is 'Request duration in milliseconds';

-- Create view for AI usage statistics
create or replace view public.ai_usage_stats as
select 
  user_id,
  mode,
  count(*) as total_requests,
  count(*) filter (where success = true) as successful_requests,
  count(*) filter (where success = false) as failed_requests,
  sum(tokens_used) as total_tokens,
  avg(duration_ms) as avg_duration_ms,
  max(created_at) as last_used_at,
  date_trunc('hour', created_at) as hour_bucket
from public.ai_usage_logs
group by user_id, mode, date_trunc('hour', created_at);

-- Comment on view
comment on view public.ai_usage_stats is 'Aggregated AI usage statistics per user and mode';

-- Create function to check rate limit
create or replace function public.check_ai_rate_limit(
  p_user_id uuid,
  p_limit integer default 60,
  p_window_minutes integer default 60
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.ai_usage_logs
  where user_id = p_user_id
    and created_at > now() - (p_window_minutes || ' minutes')::interval;
  
  return v_count < p_limit;
end;
$$;

-- Comment on function
comment on function public.check_ai_rate_limit is 'Checks if user is within AI rate limit. Returns true if allowed, false if exceeded.';

-- Grant permissions
grant select on public.ai_usage_logs to authenticated;
grant select on public.ai_usage_stats to authenticated;
grant execute on function public.check_ai_rate_limit to authenticated;
