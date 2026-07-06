export { writeAuditEvent } from "./auth-audit.ts"
export { getAuthenticatedActor, requireAdminActor } from "./auth-context.ts"
export { corsHeaders, handleCors } from "./auth-cors.ts"
export {
  getRequestFingerprint,
  hashSensitiveValue,
  maskCpf,
  maskPhone,
  normalizeCpf,
} from "./auth-cpf.ts"
export { AuthFunctionError } from "./auth-errors.ts"
export { registerRateLimitAttempt } from "./auth-rate-limit.ts"
export { genericAuthError, genericAuthMessage, jsonResponse } from "./auth-responses.ts"
export {
  createAdminClient,
  createPasswordAuthClient,
} from "./auth-supabase-admin.ts"
export {
  adminActionSchema,
  adminCreateUserSchema,
  authPasswordSchema,
  authStartSchema,
  flowCpfSchema,
  profilePasswordSchema,
  profilePhoneSchema,
  recoveryRequestSchema,
} from "./auth-validation.ts"
