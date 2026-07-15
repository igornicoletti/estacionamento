export const APP_HMAC_SECRET_ENV = "APP_HMAC_SECRET"

export { writeAuditEvent } from "./auth-audit.ts"
export {
  actorHasPermission,
  getAuthenticatedActor,
  requireAdminActor,
  requirePermissionActor,
} from "./auth-context.ts"
export { getCorsHeaders, handleCors } from "./auth-cors.ts"
export {
  formatCpf,
  formatPhone,
  getRequestFingerprint,
  hashSensitiveValue,
  maskCpf,
  maskPhone,
  normalizeCpf,
  normalizePhone
} from "./auth-cpf.ts"
export { clearRateLimitByKeyHash, registerRateLimitAttempt } from "./auth-rate-limit.ts"
export {
  authError,
  genericAuthError,
  genericAuthMessage,
  jsonResponse,
} from "./auth-responses.ts"
export { fetchWithErpRetry } from "./erp-fetch-retry.ts"
export {
  createAdminClient,
  createPasswordAuthClient
} from "./auth-supabase-admin.ts"
export {
  adminActionSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  authPasswordSchema,
  authStartSchema,
  flowCpfSchema,
  profilePasswordSchema,
  profilePhoneSchema,
  profileUpdateSchema,
  recoveryRequestSchema
} from "./auth-validation.ts"
