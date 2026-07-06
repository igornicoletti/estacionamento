import { authCopy } from "../auth-copy"

type AuthPublicErrorCode =
  | "AUTH_GENERIC"
  | "AUTH_PASSKEY"
  | "AUTH_SUPABASE_NOT_CONFIGURED"

const authPublicMessagesByCode: Record<AuthPublicErrorCode, string> = {
  AUTH_GENERIC: authCopy.feedback.genericAuthError,
  AUTH_PASSKEY: authCopy.feedback.passkeyAuthError,
  AUTH_SUPABASE_NOT_CONFIGURED: authCopy.feedback.supabaseNotConfigured,
}

export class AuthPublicError extends Error {
  code: AuthPublicErrorCode

  constructor(code: AuthPublicErrorCode) {
    super(authPublicMessagesByCode[code])
    this.code = code
    this.name = "AuthPublicError"
  }
}

export function reportAuthInternalError(context: string, caughtError: unknown) {
  if (!import.meta.env.DEV || typeof console === "undefined") {
    return
  }

  console.error(`[auth:${context}]`, caughtError)
}

export function createAuthPublicError(
  code: AuthPublicErrorCode,
  context: string,
  caughtError?: unknown
) {
  if (caughtError !== undefined) {
    reportAuthInternalError(context, caughtError)
  }

  return new AuthPublicError(code)
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AuthPublicError) {
    return error.message
  }

  return fallback
}
