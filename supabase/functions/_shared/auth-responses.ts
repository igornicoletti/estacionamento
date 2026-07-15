import { getCorsHeaders } from "./auth-cors.ts"

export const genericAuthMessage =
  "Não foi possível continuar com os dados informados."

export type AuthErrorCode =
  | "dependency_unavailable"
  | "forbidden"
  | "invalid_payload"
  | "invalid_response"
  | "method_not_allowed"
  | "not_found"
  | "request_failed"
  | "unauthorized"

// CORS is rejected at the beginning of each handler. Responses without Origin
// are used by server-to-server calls and do not receive a wildcard origin.
export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  req?: Request
) {
  const headers = req ? getCorsHeaders(req) : {}

  return new Response(JSON.stringify(body), {
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    status,
  })
}

export function genericAuthError(status = 400, req?: Request) {
  return jsonResponse(
    {
      ok: false,
      code: "request_failed",
      message: genericAuthMessage,
    },
    status,
    req
  )
}

export function authError(
  code: AuthErrorCode,
  status = 400,
  req?: Request,
  message = genericAuthMessage
) {
  return jsonResponse(
    {
      ok: false,
      code,
      message,
    },
    status,
    req
  )
}
