-- Correr en Supabase → SQL Editor

-- Tabla de usuarios
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  plan text default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz default now()
);

-- Tabla de uso mensual
create table if not exists usage (
  id uuid default gen_random_uuid() primary key,
  email text not null references users(email) on delete cascade,
  month text not null, -- formato: '2026-04'
  count int default 0,
  created_at timestamptz default now(),
  unique(email, month)
);

-- Columnas de agencia para overlay en posts (correr si ya tenés la tabla)
alter table users add column if not exists agency_name text;
alter table users add column if not exists logo_data text; -- base64 data URL del logo

-- Índices para performance
create index if not exists usage_email_month on usage(email, month);

-- Row Level Security (básico, para que solo el server pueda leer/escribir)
alter table users enable row level security;
alter table usage enable row level security;

-- Políticas: solo acceso desde el service role (server-side)
create policy "Service role only - users" on users
  using (auth.role() = 'service_role');

create policy "Service role only - usage" on usage
  using (auth.role() = 'service_role');
