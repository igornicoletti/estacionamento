drop policy if exists "commercial readers can read price tables" on public.commercial_price_tables;
drop policy if exists "commercial managers can mutate price tables" on public.commercial_price_tables;
drop policy if exists "commercial managers can insert price tables" on public.commercial_price_tables;
drop policy if exists "commercial managers can update price tables" on public.commercial_price_tables;
drop policy if exists "commercial managers can delete price tables" on public.commercial_price_tables;

create policy "commercial readers can read price tables"
on public.commercial_price_tables
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin', 'auditor')
);

create policy "commercial managers can insert price tables"
on public.commercial_price_tables
for insert
to authenticated
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "commercial managers can update price tables"
on public.commercial_price_tables
for update
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
)
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "commercial managers can delete price tables"
on public.commercial_price_tables
for delete
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

drop policy if exists "commercial readers can read price tiers" on public.commercial_price_tiers;
drop policy if exists "commercial managers can mutate price tiers" on public.commercial_price_tiers;
drop policy if exists "commercial managers can insert price tiers" on public.commercial_price_tiers;
drop policy if exists "commercial managers can update price tiers" on public.commercial_price_tiers;
drop policy if exists "commercial managers can delete price tiers" on public.commercial_price_tiers;

create policy "commercial readers can read price tiers"
on public.commercial_price_tiers
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin', 'auditor')
);

create policy "commercial managers can insert price tiers"
on public.commercial_price_tiers
for insert
to authenticated
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "commercial managers can update price tiers"
on public.commercial_price_tiers
for update
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
)
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "commercial managers can delete price tiers"
on public.commercial_price_tiers
for delete
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

drop policy if exists "commercial readers can read rules" on public.commercial_rules;
drop policy if exists "commercial managers can mutate rules" on public.commercial_rules;
drop policy if exists "commercial managers can insert rules" on public.commercial_rules;
drop policy if exists "commercial managers can update rules" on public.commercial_rules;
drop policy if exists "commercial managers can delete rules" on public.commercial_rules;

create policy "commercial readers can read rules"
on public.commercial_rules
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin', 'auditor')
);

create policy "commercial managers can insert rules"
on public.commercial_rules
for insert
to authenticated
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "commercial managers can update rules"
on public.commercial_rules
for update
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
)
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "commercial managers can delete rules"
on public.commercial_rules
for delete
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);
