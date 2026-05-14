create table if not exists whatsapp_workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  recipient text not null,
  message text not null,
  send_delay_minutes integer not null default 0,
  status text not null check (status in ('draft', 'queued', 'sending', 'sent', 'failed')),
  provider text,
  provider_message_id text,
  last_error text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_workflows_user_id on whatsapp_workflows(user_id);
create index if not exists idx_whatsapp_workflows_status on whatsapp_workflows(status);