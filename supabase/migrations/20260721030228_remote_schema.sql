CREATE INDEX access_recovery_requests_reviewed_by_idx ON public.access_recovery_requests USING btree (reviewed_by);

CREATE INDEX app_users_created_by_idx ON public.app_users USING btree (created_by);

CREATE INDEX app_users_updated_by_idx ON public.app_users USING btree (updated_by);

CREATE INDEX notification_deliveries_recipient_app_user_id_idx ON public.notification_deliveries USING btree (recipient_app_user_id);

CREATE INDEX unit_sync_runs_requested_by_idx ON public.unit_sync_runs USING btree (requested_by);


  create policy "privileged users can read avatars"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) OR ( SELECT private.has_current_user_permission('users.read'::text) AS has_current_user_permission) OR ( SELECT private.has_current_user_permission('audit.read'::text) AS has_current_user_permission))));



