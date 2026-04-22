-- UniAsk Database Schema
-- Run this entire file in Supabase SQL Editor

-- Schools table
create table if not exists schools (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  code text not null unique,
  created_at timestamptz default now()
);

-- Insert default schools
insert into schools (name, code) values
  ('Aoyama Gakuin University', '12345'),
  ('Waseda University', '23456'),
  ('Keio University', '34567')
on conflict do nothing;

-- Profiles table (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null check (role in ('student', 'alumni', 'admin')),
  school_code text not null,
  student_code text unique,
  notif_line boolean default true,
  notif_email boolean default true,
  line_connected boolean default false,
  line_user_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Questions table
create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  student_code text not null,
  question text not null,
  target text not null default 'anyone',
  target_name text not null default 'Anyone',
  status text not null default 'open' check (status in ('open', 'assigned', 'answered')),
  assigned_to text[] default '{}',
  assigned_at timestamptz,
  answer text,
  answered_by uuid references profiles(id),
  answered_by_name text,
  answered_at timestamptz,
  edits jsonb default '[]',
  is_faq boolean default false,
  faq_category text,
  faq_title text,
  edited_at timestamptz,
  remind_at timestamptz,
  rejected_by text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Function to auto-generate a unique student_code on profile creation
create or replace function generate_student_code(role text)
returns text as $$
declare
  prefix text;
  code text;
  exists boolean;
begin
  prefix := case when role = 'alumni' then 'ALM-' when role = 'admin' then 'ADM-' else 'STU-' end;
  loop
    code := prefix || lpad(floor(random() * 10000000)::text, 7, '0');
    select count(*) > 0 into exists from profiles where student_code = code;
    exit when not exists;
  end loop;
  return code;
end;
$$ language plpgsql;

-- Trigger to auto-set student_code and updated_at
create or replace function handle_new_profile()
returns trigger as $$
begin
  if new.student_code is null then
    new.student_code := generate_student_code(new.role);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger before_profile_insert
  before insert on profiles
  for each row execute function handle_new_profile();

-- Trigger to update updated_at on questions
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger questions_updated_at
  before update on questions
  for each row execute function update_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Handle new auth user → create profile automatically
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Profile is created by the app after signup with extra fields
  -- This trigger just ensures the user exists
  return new;
end;
$$ language plpgsql;
