-- MenteAberta: autenticação Supabase Auth, dados privados e comunidade moderada.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table private.administrators (email text primary key check (email = lower(email)));
alter table private.administrators enable row level security;
revoke all on private.administrators from public, anon, authenticated;

-- Somente e-mails confirmados, cadastrados pelo proprietário no banco, são administradores.
-- user_metadata não participa de nenhuma decisão de autorização.
create function private.is_admin() returns boolean language sql stable security definer
set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from auth.users u join private.administrators a on a.email = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;
create function public.current_user_is_admin() returns boolean language sql stable security invoker
set search_path = '' as $$ select private.is_admin(); $$;
revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (category in ('#Ansiedade','#Bullying','#Autoestima','#Família')),
  author text not null check (char_length(btrim(author)) between 1 and 60),
  content text not null check (char_length(btrim(content)) between 1 and 900),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index community_posts_owner on public.community_posts(user_id, created_at desc);
create index community_posts_feed on public.community_posts(status, created_at desc);
alter table public.community_posts enable row level security;
revoke all on public.community_posts from anon, authenticated;
grant select on public.community_posts to anon, authenticated;
grant insert (id,user_id,category,author,content) on public.community_posts to authenticated;
grant update (status) on public.community_posts to authenticated;
grant delete on public.community_posts to authenticated;
create policy posts_read on public.community_posts for select to anon, authenticated
using (status = 'approved' or user_id = (select auth.uid()) or (select private.is_admin()));
create policy posts_submit on public.community_posts for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending');
create policy posts_moderate on public.community_posts for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy posts_delete on public.community_posts for delete to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

create table public.post_supports (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);
create index post_supports_owner on public.post_supports(user_id);
alter table public.post_supports enable row level security;
revoke all on public.post_supports from anon, authenticated;
grant select on public.post_supports to anon, authenticated;
grant insert (post_id,user_id),delete on public.post_supports to authenticated;
create policy supports_read on public.post_supports for select to anon, authenticated
using (exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'approved'));
create policy supports_add on public.post_supports for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.community_posts p where p.id = post_id and p.status = 'approved'));
create policy supports_remove on public.post_supports for delete to authenticated
using (user_id = (select auth.uid()));

create view public.community_feed with (security_invoker = true) as
select p.id,p.category,p.author,p.content,p.status,p.created_at,
  (select count(*)::integer from public.post_supports s where s.post_id = p.id) as likes
from public.community_posts p where p.status = 'approved';
grant select on public.community_feed to anon, authenticated;

create table public.emotion_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mood text not null check (mood in ('Muito Feliz','Bem','Neutro','Triste','Ansioso')),
  created_at timestamptz not null default now()
);
create index emotion_entries_owner on public.emotion_entries(user_id,created_at desc);
alter table public.emotion_entries enable row level security;
revoke all on public.emotion_entries from anon, authenticated;
grant select,delete on public.emotion_entries to authenticated;
grant insert (mood,user_id) on public.emotion_entries to authenticated;
create policy emotions_read on public.emotion_entries for select to authenticated
using (user_id = (select auth.uid()));
create policy emotions_add on public.emotion_entries for insert to authenticated
with check (user_id = (select auth.uid()));
create policy emotions_remove on public.emotion_entries for delete to authenticated
using (user_id = (select auth.uid()));

create table public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 3 and 120),
  email text not null check (char_length(email) between 5 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  course text not null check (char_length(btrim(course)) between 2 and 100),
  enrollment text not null check (char_length(btrim(enrollment)) between 2 and 60),
  semester text not null check (char_length(btrim(semester)) between 1 and 40),
  motivation text not null check (char_length(btrim(motivation)) between 10 and 3000),
  availability text not null check (availability in ('2 a 4 horas semanais','5 a 8 horas semanais','Mais de 8 horas semanais')),
  experience text not null check (char_length(btrim(experience)) between 3 and 3000),
  document_path text not null,
  consent_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  constraint volunteer_document_owner check (document_path like user_id::text || '/' || id::text || '/document.%')
);
create index volunteer_applications_status on public.volunteer_applications(status,created_at desc);
alter table public.volunteer_applications enable row level security;
revoke all on public.volunteer_applications from anon, authenticated;
grant select,delete on public.volunteer_applications to authenticated;
grant insert (id,user_id,full_name,email,course,enrollment,semester,motivation,availability,experience,document_path) on public.volunteer_applications to authenticated;
grant update (status) on public.volunteer_applications to authenticated;
create policy volunteers_read on public.volunteer_applications for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy volunteers_add on public.volunteer_applications for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending');
create policy volunteers_moderate on public.volunteer_applications for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy volunteers_remove on public.volunteer_applications for delete to authenticated
using (user_id = (select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('volunteer-documents','volunteer-documents',false,5242880,
  array['application/pdf','image/jpeg','image/png','image/webp']);
create policy volunteer_files_insert on storage.objects for insert to authenticated
with check (bucket_id = 'volunteer-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy volunteer_files_read on storage.objects for select to authenticated
using (bucket_id = 'volunteer-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
create policy volunteer_files_delete on storage.objects for delete to authenticated
using (bucket_id = 'volunteer-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
