-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Contacts table
create table public.contacts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- Core fields
  first_name    text not null default '',
  last_name     text not null default '',
  company       text,
  birthday      text,
  note          text,
  avatar_url    text,
  sponsor_id    uuid references public.contacts(id) on delete set null,

  -- JSON fields (arrays stored as jsonb)
  phones        jsonb not null default '[]',
  emails        jsonb not null default '[]',
  addresses     jsonb not null default '[]',
  tags          jsonb not null default '[]',

  -- Per-attribute timestamps for 3-way merge (field -> ISO timestamp)
  field_timestamps jsonb not null default '{}',

  -- Standard timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast user queries
create index contacts_user_id_idx on public.contacts(user_id);
create index contacts_last_name_idx on public.contacts(user_id, last_name);
create index contacts_updated_at_idx on public.contacts(user_id, updated_at);

-- Row Level Security: users can only access their own contacts
alter table public.contacts enable row level security;

create policy "Users can view own contacts"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert own contacts"
  on public.contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contacts"
  on public.contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete own contacts"
  on public.contacts for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- Supabase Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

-- Storage RLS: users can only manage their own avatars
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');
