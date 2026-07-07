export { writeAuditEvent } from "./auth-audit.ts"
export { getAuthenticatedActor, requireAdminActor } from "./auth-context.ts"
export { getCorsHeaders, handleCors } from "./auth-cors.ts"
export {
  getRequestFingerprint,
  formatCpf,
  formatPhone,
  hashSensitiveValue,
  maskCpf,
  maskPhone,
  normalizeCpf
} from "./auth-cpf.ts"
export { clearRateLimitByKeyHash, registerRateLimitAttempt } from "./auth-rate-limit.ts"
export { genericAuthError, genericAuthMessage, jsonResponse } from "./auth-responses.ts"
export { fetchWithErpRetry } from "./erp-fetch-retry.ts"
export {
  createAdminClient,
  createPasswordAuthClient
} from "./auth-supabase-admin.ts"
export {
  adminActionSchema,
  adminCreateUserSchema,
  adminPhoneChangeReviewSchema,
  adminRecoveryReviewSchema,
  adminUpdateUserSchema,
  authPasswordSchema,
  cpfSchema,
  authStartSchema,
  flowCpfSchema,
  profilePasswordSchema,
  profilePhoneSchema,
  recoveryRequestSchema
} from "./auth-validation.ts"
