export class AppError extends Error {
  constructor(
    message: string,
    public readonly code = "app_error"
  ) {
    super(message)
    this.name = "AppError"
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function toError(caughtError: unknown, fallbackMessage: string) {
  return caughtError instanceof Error
    ? caughtError
    : new Error(fallbackMessage)
}
