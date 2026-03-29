-- Tenrixa (AI Tender Risk Analysis Platform) - Supabase setup
-- Run this in Supabase SQL Editor.

-- 1) Extensions
create extension if not exists "pgcrypto";

-- 2) Tables
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  free_analyses_used int not null default 0,
  free_analyses_limit int not null default 3,
  pro_subscription_ends_at timestamptz
);

create table if not exists public.tender_documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.tender_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.tender_documents(id) on delete set null,
  original_filename text,
  risk_level text,
  overall_score int,
  analysis_json jsonb,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.tender_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  remaining_credits int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  type text not null,
  status text not null,
  amount_inr int,
  credits_awarded int not null default 0,
  raw jsonb,
  created_at timestamptz not null default now()
);

-- 3) Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 4) RLS policies
alter table public.user_profiles enable row level security;
alter table public.tender_documents enable row level security;
alter table public.tender_analyses enable row level security;
alter table public.tender_credits enable row level security;
alter table public.payment_transactions enable row level security;

-- user_profiles
create policy "user_profiles: users select own row"
on public.user_profiles
for select
using (id = auth.uid());

create policy "user_profiles: users update own row"
on public.user_profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- tender_documents
create policy "tender_documents: users select own documents"
on public.tender_documents
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "tender_documents: users insert own documents"
on public.tender_documents
for insert
with check (user_id = auth.uid());

-- tender_analyses
create policy "tender_analyses: users select own analyses"
on public.tender_analyses
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "tender_analyses: users insert own analyses"
on public.tender_analyses
for insert
with check (user_id = auth.uid());

-- tender_credits
create policy "tender_credits: users select own credits"
on public.tender_credits
for select
using (user_id = auth.uid());

create policy "tender_credits: users update own credits"
on public.tender_credits
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- payment_transactions
create policy "payment_transactions: users select own rows"
on public.payment_transactions
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 5) Storage bucket security (private documents)
-- Create/ensure a private bucket named `tender-docs`
insert into storage.buckets (id, name, public)
values ('tender-docs', 'tender-docs', false)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "storage: users read their own documents"
on storage.objects
for select
using (
  bucket_id = 'tender-docs'
  and (
    auth.uid() = (storage.foldername(name))::uuid
    or exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
);

create policy "storage: users insert their own documents"
on storage.objects
for insert
with check (
  bucket_id = 'tender-docs'
  and auth.uid() = (storage.foldername(name))::uuid
);

create policy "storage: users update their own documents"
on storage.objects
for update
using (
  bucket_id = 'tender-docs'
  and auth.uid() = (storage.foldername(name))::uuid
);

create policy "storage: users delete their own documents"
on storage.objects
for delete
using (
  bucket_id = 'tender-docs'
  and auth.uid() = (storage.foldername(name))::uuid
);

-- 6) Entitlement RPCs (atomic quota consumption)
create or replace function public.consume_free_analysis(uid uuid)
returns boolean
language plpgsql
as $$
declare
  consumed boolean := false;
begin
  update public.user_profiles
  set free_analyses_used = free_analyses_used + 1
  where id = uid
    and plan = 'free'
    and free_analyses_used < free_analyses_limit
  returning true into consumed;

  return coalesce(consumed, false);
end;
$$;

create or replace function public.consume_tender_credit(uid uuid)
returns boolean
language plpgsql
as $$
declare
  consumed boolean := false;
begin
  update public.tender_credits
  set remaining_credits = remaining_credits - 1,
      updated_at = now()
  where user_id = uid
    and remaining_credits > 0
  returning true into consumed;

  return coalesce(consumed, false);
end;
$$;

