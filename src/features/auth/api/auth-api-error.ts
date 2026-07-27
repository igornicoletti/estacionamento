import { authCopy } from "../constants"

export class AuthApiError extends Error {
  constructor(message: string = authCopy.errors.unavailable) {
    super(message)
    this.name = "AuthApiError"
  }
}

export class AuthSessionExpiredError extends AuthApiError {
  constructor() {
    super(authCopy.inactivity.expiredDescription)
    this.name = "AuthSessionExpiredError"
  }
}

export function isAuthSessionExpiredError(error: unknown) {
  return error instanceof AuthSessionExpiredError
}
