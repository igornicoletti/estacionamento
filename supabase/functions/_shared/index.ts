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
  authErrorFromCaught,
  genericAuthError,
  genericAuthMessage,
  jsonResponse,
} from "./auth-responses.ts"
export { fetchWithErpRetry, fetchWithErpRetryAndDoH } from "./erp-fetch-retry.ts"
export { resolveErpBaseUrl } from "./erp-url.ts"
export {
  createAdminClient,
  createPasswordAuthClient
} from "./auth-supabase-admin.ts"
export {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  authPasswordSchema,
  authStartSchema,
  flowCpfSchema,
  newPasswordSchema,
  profilePasswordSchema,
  profileUpdateSchema,
  recoveryRequestSchema
} from "./auth-validation.ts"
