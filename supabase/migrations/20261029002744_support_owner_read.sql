-- O titular pode exportar/apagar apoios mesmo se o relato deixar de ser público.
alter policy supports_read on public.post_supports
using (user_id = (select auth.uid()) or exists (
  select 1 from public.community_posts p where p.id = post_id and p.status = 'approved'
));
