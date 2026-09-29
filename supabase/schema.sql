create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,username text unique,full_name text,avatar_url text,published boolean default false,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.resumes(id uuid primary key default gen_random_uuid(),user_id uuid unique not null references auth.users(id) on delete cascade,data jsonb not null default '{}'::jsonb,created_at timestamptz default now(),updated_at timestamptz default now());
alter table public.profiles enable row level security; alter table public.resumes enable row level security;
create policy "profiles owner" on public.profiles for all using(auth.uid()=id) with check(auth.uid()=id);
create policy "published profiles public" on public.profiles for select using(published=true);
create policy "resumes owner" on public.resumes for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
