alter table if exists public.access_recovery_requests
  add column if not exists target_account_found boolean,
  add column if not exists target_user_name text,
  add column if not exists phone_matches_account boolean,
  add column if not exists email_matches_account boolean;

comment on column public.access_recovery_requests.target_account_found is
  'Flag administrativa calculada pela Edge Function para indicar se o CPF informado corresponde a uma conta existente. Não expor em fluxo público.';

comment on column public.access_recovery_requests.target_user_name is
  'Nome administrativo da conta localizada pelo CPF HMAC, usado apenas para revisão interna da solicitação.';

comment on column public.access_recovery_requests.phone_matches_account is
  'Flag administrativa calculada pela Edge Function para indicar se o telefone informado confere com o telefone completo cadastrado quando disponível.';

comment on column public.access_recovery_requests.email_matches_account is
  'Flag administrativa calculada pela Edge Function para indicar se o e-mail informado confere com o e-mail cadastrado ou técnico quando informado.';
