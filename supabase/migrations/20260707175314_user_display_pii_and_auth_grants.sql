alter table public.app_users
  add column if not exists cpf_display text,
  add column if not exists phone_display text;

comment on column public.app_users.cpf_display is
  'CPF formatado para exibicao autorizada. Nao e derivavel de cpf_hmac; registros legados exigem backfill de fonte autorizada.';

comment on column public.app_users.phone_display is
  'Telefone formatado para exibicao autorizada. Registros legados exigem backfill de fonte autorizada.';

revoke execute on function public.current_user_role() from public, anon, authenticated;
revoke execute on function public.current_user_status() from public, anon, authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_status() to authenticated;

revoke execute on function public.audit_unit_yard_config_change() from public, anon, authenticated;

revoke all on function public.list_app_user_last_access() from public;
revoke all on function public.list_app_user_last_access() from anon;
revoke all on function public.list_app_user_last_access() from authenticated;
grant execute on function public.list_app_user_last_access() to authenticated;
