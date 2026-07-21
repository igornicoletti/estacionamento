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

export async function readResponseErrorMessage(error: unknown) {
  const context =
    typeof error === "object" && error !== null && "context" in error
      ? (error as { context?: unknown }).context
      : null

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { message?: unknown }

      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message
      }
    } catch {
      return null
    }

    return null
  }

  return error instanceof Error && error.message.trim() ? error.message : null
}
