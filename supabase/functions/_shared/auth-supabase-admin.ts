import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.108.2"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type AppUserRole = "owner" | "admin" | "auditor" | "manager" | "operator"
type AppUserStatus = "pending" | "active" | "inactive" | "password_reset" | "passkey_reset"
type AuditScope = "login" | "system"
type AuditSeverity = "info" | "warning" | "critical"
type PermissionSource = "system" | "custom"

type DbRecord<T extends object> = T & Record<string, unknown>

type TableDefinition<
  Row extends object,
  Insert extends object = Row,
  Update extends object = Partial<Insert>,
> = {
  Row: DbRecord<Row>
  Insert: DbRecord<Insert>
  Update: DbRecord<Update>
  Relationships: []
}

interface AppUserRow {
  id: string
  auth_user_id: string
  technical_email: string
  name: string
  cpf_hmac: string
  cpf_masked: string
  cpf_display?: string | null
  phone_masked: string
  phone_display?: string | null
  phone_verified_at: string | null
  pending_phone_masked: string | null
  email: string | null
  email_verified_at: string | null
  role: AppUserRole
  status: AppUserStatus
  failed_attempts: number
  locked_until: string | null
  last_failed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

type AppUserInsert = Partial<AppUserRow> & {
  auth_user_id: string
  technical_email: string
  name: string
  cpf_hmac: string
  cpf_masked: string
  phone_masked: string
  role: AppUserRole
}

type AppUserUpdate = Partial<Omit<AppUserRow, "id" | "auth_user_id" | "created_at">>

interface AppUserUnitRow {
  id: string
  app_user_id: string
  unit_id: string
  created_at: string
}

interface AuditEventRow {
  id: string
  scope: AuditScope
  event: string
  actor: string
  actor_user_id: string | null
  target: string
  target_user_id: string | null
  success: boolean
  severity: AuditSeverity
  reason: string | null
  request_id: string | null
  ip_hash: string | null
  user_agent_hash: string | null
  metadata: Json
  occurred_at: string
}

type AuditEventInsert = Partial<AuditEventRow> & {
  scope: AuditScope
  event: string
  actor: string
  target: string
  success: boolean
}

interface PermissionGroupRow {
  id: string
  key: string
  label: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

interface PermissionRow {
  id: string
  key: string
  label: string
  description: string | null
  source: PermissionSource
  is_critical: boolean
  is_active: boolean
  group_id: string
  sort_order: number
  created_at: string
  updated_at: string
}

interface RolePermissionRow {
  id: string
  permission_id: string
  role: AppUserRole
  created_at: string
}

interface AuthSessionRow {
  id: string
}

interface AuthMfaFactorRow {
  id: string
  user_id: string
  factor_type: string
  status: string
  created_at: string
  updated_at: string
}

interface AuthFlowAttemptRow {
  id: string
  flow_id: string
  cpf_hmac: string
  app_user_id: string | null
  purpose: "login" | "first_access" | "password_reset" | "passkey_reset"
  consumed_at: string | null
  expires_at: string
  created_at: string
  request_ip_hash: string | null
  user_agent_hash: string | null
}

type AuthFlowAttemptInsert = Partial<AuthFlowAttemptRow> & {
  cpf_hmac: string
  expires_at: string
  purpose: AuthFlowAttemptRow["purpose"]
}

interface AccessRecoveryRequestRow {
  id: string
  cpf_hmac: string
  phone_masked: string
  email: string | null
  reason: "lost_phone" | "forgot_password" | "attempts_blocked" | "other"
  description: string | null
  status: "pending" | "approved" | "denied" | "completed"
  reviewed_by: string | null
  reviewed_at: string | null
  review_reason: string | null
  request_ip_hash: string | null
  user_agent_hash: string | null
  created_at: string
}

type AccessRecoveryRequestInsert = Partial<AccessRecoveryRequestRow> & {
  cpf_hmac: string
  phone_masked: string
  reason: AccessRecoveryRequestRow["reason"]
}

export interface EdgeDatabase {
  public: {
    Tables: {
      app_users: TableDefinition<AppUserRow, AppUserInsert, AppUserUpdate>
      app_user_units: TableDefinition<
        AppUserUnitRow,
        Partial<AppUserUnitRow> & Pick<AppUserUnitRow, "app_user_id" | "unit_id">,
        Partial<AppUserUnitRow>
      >
      audit_events: TableDefinition<AuditEventRow, AuditEventInsert, Partial<AuditEventInsert>>
      access_recovery_requests: TableDefinition<
        AccessRecoveryRequestRow,
        AccessRecoveryRequestInsert,
        Partial<AccessRecoveryRequestInsert>
      >
      auth_flow_attempts: TableDefinition<
        AuthFlowAttemptRow,
        AuthFlowAttemptInsert,
        Partial<AuthFlowAttemptInsert>
      >
      permission_groups: TableDefinition<PermissionGroupRow>
      permissions: TableDefinition<PermissionRow>
      role_permissions: TableDefinition<RolePermissionRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_user_role: AppUserRole
      app_user_status: AppUserStatus
      audit_scope: AuditScope
      audit_severity: AuditSeverity
    }
    CompositeTypes: Record<string, never>
  }
  auth: {
    Tables: {
      mfa_factors: TableDefinition<AuthMfaFactorRow>
      sessions: TableDefinition<AuthSessionRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type EdgeSupabaseClient = SupabaseClient<EdgeDatabase>

function requireEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required env ${name}`)
  }

  return value
}

function createEdgeClient(
  key: string,
  authorization?: string
): EdgeSupabaseClient {
  return createClient<EdgeDatabase>(
    requireEnv("SUPABASE_URL"),
    requireEnv(key),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: authorization
        ? {
          headers: {
            Authorization: authorization,
          },
        }
        : undefined,
    }
  )
}

export function createAdminClient() {
  return createEdgeClient("SUPABASE_SERVICE_ROLE_KEY")
}

export function createPasswordAuthClient() {
  return createEdgeClient("SUPABASE_ANON_KEY")
}

export function createAuthorizedClient(authorization: string) {
  return createEdgeClient("SUPABASE_ANON_KEY", authorization)
}
