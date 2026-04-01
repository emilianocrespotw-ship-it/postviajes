-- PostViajes – Schema de Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Tabla de usuarios (sincronizada con NextAuth via trigger o manualmente)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  facebook_id text unique,
  facebook_token text, -- page access token para publicar
  facebook_page_id text,
  instagram_user_id text,
  plan text default 'trial', -- trial | monthly | annual
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now()
);

-- Tabla de posts generados
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  flyer_url text,               -- URL del flyer en Supabase Storage
  destination text,             -- Destino detectado por la IA
  generated_text_fb text,       -- Texto generado para Facebook
  generated_text_ig text,       -- Caption generado para Instagram
  selected_image_url text,      -- URL de la imagen elegida (Pexels)
  style text default 'minimal', -- Estilo visual elegido
  status text default 'draft',  -- draft | published | error
  fb_post_id text,              -- ID del post publicado en Facebook
  ig_media_id text,             -- ID del media publicado en Instagram
  created_at timestamptz default now(),
  published_at timestamptz
);

-- Storage bucket para los flyers subidos
insert into storage.buckets (id, name, public)
values ('flyers', 'flyers', false)
on conflict do nothing;

-- Política: cada usuario solo puede subir/ver sus propios flyers
create policy "Users can upload their own flyers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'flyers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read their own flyers"
on storage.objects for select
to authenticated
using (bucket_id = 'flyers' and (storage.foldername(name))[1] = auth.uid()::text);

-- Row Level Security
alter table users enable row level security;
alter table posts enable row level security;

create policy "Users see their own data" on users
  for all using (auth.uid()::text = facebook_id);

create policy "Users see their own posts" on posts
  for all using (user_id in (select id from users where facebook_id = auth.uid()::text));
