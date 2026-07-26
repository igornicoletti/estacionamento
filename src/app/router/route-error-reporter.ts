import { isRouteErrorResponse } from "react-router"

export interface RouteErrorReport {
  errorId: string
  error: unknown
  source: "route-boundary" | "router-provider"
}

export function createRouteErrorId() {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `route-error-${Date.now().toString(36)}`
}

export function getRouteErrorStatus(error: unknown) {
  return isRouteErrorResponse(error) ? error.status : "unexpected"
}

export function reportRouteError({
  errorId,
  error,
  source,
}: RouteErrorReport) {
  const status = getRouteErrorStatus(error)

  if (import.meta.env.DEV) {
    console.error(`[${source}:${errorId}]`, error)
    return
  }

  console.error("[route-error]", {
    errorId,
    source,
    status,
  })
}
