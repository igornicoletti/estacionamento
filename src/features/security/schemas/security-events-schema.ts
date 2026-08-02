import { z } from "zod"

export const securityAuditEventCodeValues = [
  "access_recovery_requested",
  "access_recovery_reviewed",
  "account_locked",
  "mfa_enabled",
  "passkey_registered",
  "passkey_reset_requested",
  "password_changed",
  "password_reset_requested",
  "phone_change_requested",
  "profile_updated",
  "security_device_trusted",
  "security_logins_reviewed",
  "sessions_revoked",
  "temporary_lock_cleared",
  "user_blocked",
  "user_unblocked",
] as const

export type SecurityAuditEventCode =
  (typeof securityAuditEventCodeValues)[number]

export const securityAuditEventRowsSchema = z.array(
  z
    .object({
      event_code: z.enum(securityAuditEventCodeValues),
      event_id: z.uuid(),
      occurred_at: z.iso.datetime({ offset: true }),
      severity: z.enum(["info", "warning", "critical"]),
      success: z.boolean(),
    })
    .strict()
).max(5)

export type SecurityAuditEventRow = z.infer<
  typeof securityAuditEventRowsSchema
>[number]
