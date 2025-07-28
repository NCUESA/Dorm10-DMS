-- 對話紀錄表
create table public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  user_student_id text,
  message text not null,
  response text,
  session_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 建立索引以提升查詢效能
create index idx_chat_logs_user_id on public.chat_logs(user_id);
create index idx_chat_logs_session_id on public.chat_logs(session_id);
create index idx_chat_logs_created_at on public.chat_logs(created_at);

-- 啟用 RLS
alter table public.chat_logs enable row level security;

-- 管理員可以查看所有對話紀錄
create policy "管理員可以查看所有對話紀錄" on public.chat_logs
  for select using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

-- 用戶只能查看自己的對話紀錄
create policy "用戶只能查看自己的對話紀錄" on public.chat_logs
  for select using (auth.uid() = user_id);

-- 所有用戶都可以插入新的對話紀錄
create policy "所有用戶都可以插入對話紀錄" on public.chat_logs
  for insert with check (auth.uid() = user_id);

-- 公告表
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  summary text,
  category text not null check (category in ('A', 'B', 'C', 'D', 'E')),
  application_deadline date,
  announcement_deadline date,
  target_audience text,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 建立索引
create index idx_announcements_status on public.announcements(status);
create index idx_announcements_category on public.announcements(category);
create index idx_announcements_deadline on public.announcements(application_deadline);
create index idx_announcements_created_at on public.announcements(created_at);

-- 啟用 RLS
alter table public.announcements enable row level security;

-- 所有人可以查看已發布的公告
create policy "所有人可以查看已發布公告" on public.announcements
  for select using (status = 'published');

-- 管理員可以進行所有操作
create policy "管理員可以管理公告" on public.announcements
  for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

-- 公告文件表（用於存放PDF檔案資訊）
create table public.announcement_files (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid references public.announcements(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  file_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 建立索引
create index idx_announcement_files_announcement_id on public.announcement_files(announcement_id);

-- 啟用 RLS
alter table public.announcement_files enable row level security;

-- 所有人可以查看公告文件
create policy "所有人可以查看公告文件" on public.announcement_files
  for select using (
    exists (
      select 1 from public.announcements 
      where announcements.id = announcement_id 
      and announcements.status = 'published'
    )
  );

-- 管理員可以管理文件
create policy "管理員可以管理公告文件" on public.announcement_files
  for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );
