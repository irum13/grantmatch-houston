create extension if not exists "pgcrypto";

create type public.funding_type as enum (
  'grant',
  'competition',
  'matching-program',
  'accelerator',
  'loan',
  'support'
);

create type public.opportunity_status as enum (
  'active',
  'forecasted',
  'verify',
  'closed'
);

create table public.funding_opportunities (
  id text primary key,
  name text not null,
  provider text not null,
  funding_type public.funding_type not null,
  amount_min integer not null default 0 check (amount_min >= 0),
  amount_max integer not null default 0 check (amount_max >= amount_min),
  eligible_locations text[] not null default '{}',
  business_stages text[] not null default '{}',
  industries text[] not null default '{}',
  allowed_uses text[] not null default '{}',
  disallowed_uses text[] not null default '{}',
  for_profit_eligible boolean not null default true,
  requires_incorporation boolean not null default false,
  requires_university_affiliation boolean not null default false,
  requires_technology boolean not null default false,
  requires_research boolean not null default false,
  min_employees integer,
  max_employees integer,
  revenue_requirement text,
  required_documents text[] not null default '{}',
  deadline text not null,
  status public.opportunity_status not null default 'verify',
  source_url text not null,
  application_url text not null,
  last_verified date not null,
  geographic_scope text not null,
  description text not null,
  application_complexity text not null
    check (application_complexity in ('low', 'medium', 'high')),
  matching_requirement text,
  demo_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.founder_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  business_name text not null,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  profile_id uuid references public.founder_profiles(id) on delete cascade,
  opportunity_id text not null,
  score integer not null check (score between 0 and 100),
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index funding_opportunities_status_idx
  on public.funding_opportunities(status);
create index funding_opportunities_deadline_idx
  on public.funding_opportunities(deadline);
create index founder_profiles_user_idx
  on public.founder_profiles(user_id);
create index saved_matches_user_idx
  on public.saved_matches(user_id);

alter table public.funding_opportunities enable row level security;
alter table public.founder_profiles enable row level security;
alter table public.saved_matches enable row level security;

create policy "Public opportunities are readable"
  on public.funding_opportunities
  for select
  using (not demo_only and status <> 'closed');

create policy "Users manage their own profiles"
  on public.founder_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own saved matches"
  on public.saved_matches
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
