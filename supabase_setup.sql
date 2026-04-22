-- ═══════════════════════════════════════════════════════════════════════════
-- UniAsk — Complete Supabase SQL Setup
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. SCHOOLS TABLE ────────────────────────────────────────────────────────
create table if not exists schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  created_at  timestamptz default now()
);

-- Seed one school so registration works immediately
insert into schools (name, code) values
  ('Aoyama Gakuin University', '12345'),
  ('Waseda University',        '23456'),
  ('Keio University',          '34567')
on conflict do nothing;


-- ── 2. PROFILES TABLE ───────────────────────────────────────────────────────
-- Mirrors auth.users. Populated automatically via trigger below.
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  name          text,
  role          text check (role in ('student','alumni','admin')) default 'student',
  school_code   text,
  student_code  text unique,
  notif_email   boolean default true,
  line_id       text,           -- filled when LINE integration is set up
  deleted       boolean default false,
  created_at    timestamptz default now()
);


-- ── 3. QUESTIONS TABLE ──────────────────────────────────────────────────────
create table if not exists questions (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid references profiles(id) on delete set null,
  student_code     text,
  student_name     text,        -- admin-visible only (set by trigger)
  question         text not null,
  target_id        uuid references profiles(id) on delete set null,
  target_name      text,
  status           text check (status in ('open','assigned','answered')) default 'open',
  assigned_to      uuid[] default '{}',    -- array of alumni profile IDs
  assigned_at      timestamptz,
  rejected_by      uuid[] default '{}',    -- alumni who rejected
  answer           text,
  answered_by      text,        -- profile id or 'admin'
  answered_by_name text,
  answered_at      timestamptz,
  edited_at        timestamptz,
  edits            jsonb default '[]',     -- [{text, at}]
  remind_at        timestamptz,
  is_faq           boolean default false,
  faq_title        text,
  faq_category     text,
  created_at       timestamptz default now()
);


-- ── 4. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, name, role, school_code, student_code)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'school_code',
    new.raw_user_meta_data->>'student_code'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── 5. ROW LEVEL SECURITY ────────────────────────────────────────────────────
alter table schools   enable row level security;
alter table profiles  enable row level security;
alter table questions enable row level security;

-- Schools: anyone can read (needed for registration code check)
create policy "schools_read_all" on schools for select using (true);
create policy "schools_admin_write" on schools for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Profiles: users see their own; admins see all
create policy "profiles_own" on profiles for select using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Questions: students see only theirs
create policy "questions_student_own" on questions for select using (
  student_id = auth.uid()
  or is_faq = true
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin','alumni'))
);
create policy "questions_student_insert" on questions for insert with check (
  student_id = auth.uid()
);
create policy "questions_student_update" on questions for update using (
  student_id = auth.uid()   -- allows remind_at update
  or auth.uid() = any(assigned_to)  -- alumni can answer
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "questions_admin_all" on questions for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);


-- ── 6. EMAIL NOTIFICATIONS VIA SUPABASE EDGE FUNCTIONS ───────────────────────
-- This trigger calls an Edge Function whenever a question row changes.
-- The Edge Function (deploy separately — see email_function.ts) sends the email.

create or replace function notify_question_change()
returns trigger language plpgsql security definer as $$
declare
  payload jsonb;
begin
  payload = jsonb_build_object(
    'old_status', old.status,
    'new_status', new.status,
    'question_id', new.id,
    'student_id', new.student_id,
    'assigned_to', new.assigned_to,
    'rejected_by', new.rejected_by,
    'remind_at_changed', (old.remind_at is distinct from new.remind_at),
    'answer_changed', (old.answer is distinct from new.answer)
  );
  perform net.http_post(
    url := current_setting('app.edge_function_url', true),
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.service_role_key', true)),
    body := payload::text
  );
  return new;
exception when others then
  return new; -- never block the main operation
end;
$$;

drop trigger if exists on_question_change on questions;
create trigger on_question_change
  after update on questions
  for each row execute function notify_question_change();


-- ── DONE ─────────────────────────────────────────────────────────────────────
-- Run this file once in the Supabase SQL Editor.
-- Then deploy email_function.ts as a Supabase Edge Function (see that file).
