-- UniAsk Row Level Security Policies
-- Run this in Supabase SQL Editor AFTER schema.sql

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table questions enable row level security;
alter table schools enable row level security;

-- =====================
-- SCHOOLS policies
-- =====================
-- Anyone can read schools (needed for registration)
create policy "schools_read_all" on schools
  for select using (true);

-- Only admins can insert/update schools
create policy "schools_write_admin" on schools
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- =====================
-- PROFILES policies
-- =====================
-- Users can read their own profile
create policy "profiles_read_own" on profiles
  for select using (auth.uid() = id);

-- Admins can read all profiles
create policy "profiles_read_admin" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Users can insert their own profile (on signup)
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Admins can update any profile
create policy "profiles_update_admin" on profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- =====================
-- QUESTIONS policies
-- =====================

-- Students can read their own questions
create policy "questions_read_student_own" on questions
  for select using (
    auth.uid() = student_id
  );

-- Students can insert questions
create policy "questions_insert_student" on questions
  for insert with check (
    auth.uid() = student_id and
    exists (select 1 from profiles where id = auth.uid() and role = 'student')
  );

-- Students can update their own questions (e.g. remind_at)
create policy "questions_update_student_own" on questions
  for update using (
    auth.uid() = student_id
  );

-- Alumni can read questions assigned to them (by student_code)
create policy "questions_read_alumni_assigned" on questions
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'alumni'
        and student_code = any(questions.assigned_to)
    )
  );

-- Alumni can update questions assigned to them (to answer or reject)
create policy "questions_update_alumni_assigned" on questions
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'alumni'
        and student_code = any(questions.assigned_to)
    )
  );

-- Admins can read ALL questions
create policy "questions_read_admin" on questions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Admins can insert questions (for FAQ creation)
create policy "questions_insert_admin" on questions
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Admins can update ANY question (assign, answer, make FAQ, etc.)
create policy "questions_update_admin" on questions
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can read FAQ questions (even logged-out users)
create policy "questions_read_faq_public" on questions
  for select using (is_faq = true);
