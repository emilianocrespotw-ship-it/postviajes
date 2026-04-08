-- Run this in Supabase Dashboard → SQL Editor

create table if not exists photos (
  id uuid default gen_random_uuid() primary key,
  filename text not null unique,
  storage_path text not null,
  url text not null,
  destination text,
  country text,
  tags text[] default '{}',
  description text,
  source text default 'personal',
  created_at timestamptz default now()
);

-- Index for fast destination search
create index if not exists photos_destination_idx on photos using gin(to_tsvector('spanish', coalesce(destination, '')));
create index if not exists photos_tags_idx on photos using gin(tags);
create index if not exists photos_country_idx on photos (country);

-- Enable RLS but allow service role full access
alter table photos enable row level security;
create policy "Service role full access" on photos for all using (true);
