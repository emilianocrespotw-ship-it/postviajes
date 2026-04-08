-- Run this in Supabase Dashboard → SQL Editor

alter table users add column if not exists posts_this_month integer default 0;
alter table users add column if not exists posts_reset_month text default '';
-- plan already exists ('free' | 'pro') — no change needed
