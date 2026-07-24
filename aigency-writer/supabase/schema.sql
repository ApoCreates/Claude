-- ═══════════════════════════════════════════════════════════════════════
-- DIWAN — platform schema: feedback, observability, and improvement loop
-- Shared by all Diwan agents (aql, qalam, lisan). Apply in the Supabase
-- SQL editor (or psql). Idempotent — safe to re-run.
--
-- Design contract (from the platform spec):
--   feedback → pattern detection (pg_cron) → improvement tickets
--   1–2★ outputs → review queue → human-gated resolution (traceable)
--   prompts versioned; agents improve via prompts/knowledge, not retraining
--   strict per-tenant isolation via RLS
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Tenants ─────────────────────────────────────────────────────────────
-- One row per client: tone, voice, brand guidelines, output rules,
-- terminology glossary. Injected into the agent prompt at runtime.
create table if not exists client_configs (
  client_id   text primary key,
  name        text not null,
  config      jsonb not null default '{}'::jsonb,  -- BrandProfile shape
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Prompt versioning ───────────────────────────────────────────────────
-- Every distinct built system prompt is recorded (hash-deduped) so any
-- change is traceable and its rating impact measurable before/after.
create table if not exists prompt_versions (
  id            uuid primary key default gen_random_uuid(),
  agent_name    text not null,
  hash          text not null,
  system_prompt text not null,
  change_note   text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (agent_name, hash)
);

-- Human-authored prompt amendments from the review queue: action (a)
-- prompt updates and action (c) guardrail rules. Appended to the agent's
-- system prompt at runtime — versioned behavior change without redeploy.
create table if not exists prompt_patches (
  id          uuid primary key default gen_random_uuid(),
  agent_name  text not null,
  kind        text not null check (kind in ('prompt_update','guardrail')),
  patch_text  text not null,
  active      boolean not null default true,
  created_by  text,
  created_at  timestamptz not null default now()
);

-- ── Observability ───────────────────────────────────────────────────────
-- One structured row per agent run: brief, chain, model, tokens, latency,
-- errors, final status. No silent failures — error runs are rows too.
create table if not exists agent_runs (
  id                text primary key,                  -- run-… (app-generated)
  agent_name        text not null,                     -- aql | qalam | lisan
  client_id         text,
  request_type      text,                              -- mode / task kind
  input             jsonb,                             -- brief + params
  output            text,
  status            text not null default 'ok' check (status in ('ok','error')),
  error             text,
  model             text,
  prompt_version_id uuid references prompt_versions(id),
  tokens            jsonb,                             -- raw usage object
  latency_ms        integer,
  created_at        timestamptz not null default now()
);
create index if not exists agent_runs_agent_idx  on agent_runs (agent_name, created_at desc);
create index if not exists agent_runs_client_idx on agent_runs (client_id, created_at desc);

-- ── Feedback capture ────────────────────────────────────────────────────
create table if not exists feedback (
  id              uuid primary key default gen_random_uuid(),
  output_id       text not null,                       -- agent_runs.id (soft ref)
  agent_name      text not null,
  client_id       text,
  rating          smallint not null check (rating between 1 and 5),
  feedback_text   text,
  request_type    text,
  prompt_response jsonb,                               -- pair or reference
  created_at      timestamptz not null default now()
);
create index if not exists feedback_agent_idx  on feedback (agent_name, created_at desc);
create index if not exists feedback_client_idx on feedback (client_id, created_at desc);

-- ── Human-in-the-loop review queue ──────────────────────────────────────
create table if not exists review_queue (
  id                uuid primary key default gen_random_uuid(),
  feedback_id       uuid not null references feedback(id) on delete cascade,
  status            text not null default 'open' check (status in ('open','resolved')),
  resolution_action text check (resolution_action in
                      ('prompt_update','knowledge_update','guardrail','no_action')),
  resolution_note   text,
  resolved_by       text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);
create index if not exists review_queue_open_idx on review_queue (status, created_at desc);

-- 1–2★ feedback auto-flags into the review queue.
create or replace function diwan_flag_low_rating() returns trigger
language plpgsql as $$
begin
  if new.rating <= 2 then
    insert into review_queue (feedback_id) values (new.id);
  end if;
  return new;
end $$;

drop trigger if exists feedback_low_rating_flag on feedback;
create trigger feedback_low_rating_flag
  after insert on feedback
  for each row execute function diwan_flag_low_rating();

-- ── Automated pattern detection ─────────────────────────────────────────
create table if not exists improvement_tickets (
  id              uuid primary key default gen_random_uuid(),
  scope           jsonb not null,     -- {agent_name, client_id?, request_type?}
  avg_rating      numeric(3,2) not null,
  rating_count    integer not null,
  examples        jsonb,              -- sample low-rated output refs
  suspected_cause text,
  status          text not null default 'open' check (status in ('open','in_progress','done')),
  created_at      timestamptz not null default now()
);

-- Weekly aggregation: any (agent, request_type) or (agent, client) segment
-- averaging below 3.5★ across 5+ ratings in the last 7 days becomes a
-- structured improvement ticket (deduped against open tickets).
create or replace function diwan_detect_patterns() returns integer
language plpgsql as $$
declare created integer := 0; r record;
begin
  for r in
    select agent_name, request_type as seg_key, 'request_type' as seg_kind,
           avg(rating)::numeric(3,2) as avg_rating, count(*) as n
      from feedback
     where created_at > now() - interval '7 days' and request_type is not null
     group by agent_name, request_type
    having count(*) >= 5 and avg(rating) < 3.5
    union all
    select agent_name, client_id, 'client_id',
           avg(rating)::numeric(3,2), count(*)
      from feedback
     where created_at > now() - interval '7 days' and client_id is not null
     group by agent_name, client_id
    having count(*) >= 5 and avg(rating) < 3.5
  loop
    if not exists (
      select 1 from improvement_tickets t
       where t.status <> 'done'
         and t.scope->>'agent_name' = r.agent_name
         and t.scope->>r.seg_kind    = r.seg_key
    ) then
      insert into improvement_tickets (scope, avg_rating, rating_count, examples, suspected_cause)
      values (
        jsonb_build_object('agent_name', r.agent_name, r.seg_kind, r.seg_key),
        r.avg_rating, r.n,
        (select coalesce(jsonb_agg(jsonb_build_object(
                  'output_id', f.output_id, 'rating', f.rating,
                  'feedback_text', f.feedback_text)), '[]'::jsonb)
           from (select * from feedback f2
                  where f2.agent_name = r.agent_name
                    and ((r.seg_kind = 'request_type' and f2.request_type = r.seg_key)
                      or (r.seg_kind = 'client_id'   and f2.client_id   = r.seg_key))
                    and f2.rating <= 2
                    and f2.created_at > now() - interval '7 days'
                  order by f2.created_at desc limit 3) f),
        'Segment averaged ' || r.avg_rating || '★ over ' || r.n ||
        ' ratings this week — inspect example outputs and recent prompt/knowledge changes.'
      );
      created := created + 1;
    end if;
  end loop;
  return created;
end $$;

-- Weekly schedule (Mondays 04:17 UTC). Requires the pg_cron extension:
-- Dashboard → Database → Extensions → enable "pg_cron", then re-run this.
do $$ begin
  perform cron.schedule('diwan-weekly-patterns', '17 4 * * 1',
                        $job$select diwan_detect_patterns()$job$);
exception when others then
  raise notice 'pg_cron not available yet — enable the extension and re-run: %', sqlerrm;
end $$;

-- ── Tenant isolation (RLS) ──────────────────────────────────────────────
-- The server writes with the service-role key (bypasses RLS). These
-- policies scope any future client-portal access (authenticated users
-- carrying a client_id JWT claim) to their own tenant's rows only.
alter table client_configs      enable row level security;
alter table agent_runs          enable row level security;
alter table feedback            enable row level security;
alter table review_queue        enable row level security;
alter table improvement_tickets enable row level security;
alter table prompt_versions     enable row level security;
alter table prompt_patches      enable row level security;

drop policy if exists tenant_own_config   on client_configs;
create policy tenant_own_config on client_configs for select to authenticated
  using (client_id = coalesce(auth.jwt() ->> 'client_id', ''));

drop policy if exists tenant_own_runs     on agent_runs;
create policy tenant_own_runs on agent_runs for select to authenticated
  using (client_id = coalesce(auth.jwt() ->> 'client_id', ''));

drop policy if exists tenant_own_feedback on feedback;
create policy tenant_own_feedback on feedback for all to authenticated
  using (client_id = coalesce(auth.jwt() ->> 'client_id', ''))
  with check (client_id = coalesce(auth.jwt() ->> 'client_id', ''));
-- review_queue / improvement_tickets / prompt_* stay service-role only.
