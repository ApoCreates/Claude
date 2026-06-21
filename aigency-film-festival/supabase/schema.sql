-- The Aigency Film Festival — Supabase schema
-- Paste this whole file into Supabase → SQL Editor → Run.
-- The app talks to Supabase with the SERVICE ROLE key (server-side only), which
-- bypasses RLS. We still enable RLS so nothing is readable with the public key.

-- ── submissions ──────────────────────────────────────────────────────────────
create table if not exists public.submissions (
  id               text primary key,
  slug             text unique not null,
  title            text not null,
  logline          text not null,
  youtube_url      text not null,
  duration_seconds int  not null default 0,
  poster_url       text,
  team_name        text not null,
  submitter_name   text not null,
  submitter_email  text not null,
  crew             jsonb not null default '[]'::jsonb,
  ai_tools         text default '',
  ai_disclosure    text default '',
  cohort           text not null default 'Edition I',
  category         text,
  status           text not null default 'submitted',
  award            text,
  featured         boolean not null default false,
  votes            int not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists submissions_cohort_idx on public.submissions (cohort);
create index if not exists submissions_created_idx on public.submissions (created_at desc);

-- ── ratings ──────────────────────────────────────────────────────────────────
create table if not exists public.ratings (
  id            text primary key,
  submission_id text not null references public.submissions(id) on delete cascade,
  juror         text default 'Jury',
  story         int not null default 0,
  craft         int not null default 0,
  ai            int not null default 0,
  emotion       int not null default 0,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists ratings_submission_idx on public.ratings (submission_id);

-- ── atomic audience vote ─────────────────────────────────────────────────────
create or replace function public.increment_votes(sub_id text)
returns int
language sql
as $$
  update public.submissions set votes = votes + 1 where id = sub_id returning votes;
$$;

-- ── lock down the public (anon) key — all access is server-side ──────────────
alter table public.submissions enable row level security;
alter table public.ratings enable row level security;

-- ── poster storage (public bucket) ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

-- allow anyone to READ posters (the bucket is public); uploads happen via the
-- service role from the server, which bypasses these policies.
drop policy if exists "Public read posters" on storage.objects;
create policy "Public read posters"
  on storage.objects for select
  using (bucket_id = 'posters');
