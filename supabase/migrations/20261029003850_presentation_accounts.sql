-- Em apresentações, e-mails não são verificados. Administradores são vinculados
-- a um ID de conta por um código privado de uso único, nunca apenas pelo e-mail.
alter table private.administrators
  add column user_id uuid unique references auth.users(id) on delete set null,
  add column activation_hash text;

-- Preserva administradores que já tinham conta confirmada antes da alteração.
update private.administrators a set user_id = u.id
from auth.users u where lower(u.email) = a.email and u.email_confirmed_at is not null;

create or replace function private.is_admin() returns boolean language sql stable security definer
set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from private.administrators a where a.user_id = (select auth.uid())
  );
$$;

create function private.activate_administrator(activation_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := (select auth.uid()); changed integer;
begin
  if caller_id is null or char_length(activation_code) < 32 or char_length(activation_code) > 128 then
    return false;
  end if;
  update private.administrators a
  set user_id = caller_id, activation_hash = null
  where a.user_id is null
    and a.activation_hash = encode(extensions.digest(activation_code, 'sha256'), 'hex')
    and exists (select 1 from auth.users u where u.id = caller_id and lower(u.email) = a.email);
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function private.activate_administrator(text) from public, anon;
grant execute on function private.activate_administrator(text) to authenticated;

create function public.activate_administrator(activation_code text) returns boolean
language sql security invoker set search_path = '' as $$
  select private.activate_administrator(activation_code);
$$;
revoke all on function public.activate_administrator(text) from public, anon;
grant execute on function public.activate_administrator(text) to authenticated;
