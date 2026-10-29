-- Bloqueio explícito para a lista administrativa, acessada apenas pelo helper privado.
create policy administrators_no_client_access on private.administrators
for all to anon, authenticated using (false) with check (false);
