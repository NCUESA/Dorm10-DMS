create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  student_id text,
  department text,
  year text,
  created_at timestamp with time zone default now()
);
