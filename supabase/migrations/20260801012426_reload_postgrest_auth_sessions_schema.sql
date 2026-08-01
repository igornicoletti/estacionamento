-- Ensure PostgREST exposes the session-revocation RPC immediately after deploy.
notify pgrst, 'reload schema';
