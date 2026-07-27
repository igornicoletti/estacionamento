import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260727120000_auth_phase_2_session_lifecycle.sql"
)

function readMigration() {
  return readFileSync(migrationPath, "utf8")
}

describe("auth session lifecycle migration", () => {
  it("keeps enforcement disabled during the compatible rollout", () => {
    const sql = readMigration()

    expect(sql).toContain("enforcement_enabled boolean not null default false")
    expect(sql).toContain("values (\n  true,\n  false,")
  })

  it("binds the application lease to auth.uid and the JWT session_id", () => {
    const sql = readMigration()

    expect(sql).toContain("auth.jwt() ->> 'session_id'")
    expect(sql).toContain("current_user_id uuid := auth.uid()")
    expect(sql).toContain("auth_session.user_id = current_user_id")
  })

  it("anchors the absolute deadline to the Supabase session creation", () => {
    const sql = readMigration()

    expect(sql).toContain("session_created_at")
    expect(sql).toContain("created_at = least(created_at, session_created_at)")
    expect(sql).not.toContain("then current_time\n        else created_at")
  })

  it("does not generate blanket policies dynamically", () => {
    const sql = readMigration()

    expect(sql).not.toContain("from pg_policies policy")
    expect(sql).not.toContain("as restrictive for all to authenticated")
    expect(sql).toContain("private.is_current_app_session_active()")
  })

  it("keeps low-level lease helpers unavailable to client roles", () => {
    const sql = readMigration()

    expect(sql).toContain(
      "revoke all on function private.is_current_app_session_active()"
    )
    expect(sql).not.toContain(
      "grant execute on function private.is_current_app_session_active()"
    )
    expect(sql).toContain(
      "grant execute on function private.current_user_status()"
    )
  })

  it("adds restrictive guards only to explicitly audited bypass tables", () => {
    const sql = readMigration()

    expect(sql.match(/create policy "active app session required"/g)).toHaveLength(3)
    expect(sql).toContain("on public.app_users")
    expect(sql).toContain("on public.app_user_units")
    expect(sql).toContain("on storage.objects")
  })
})
