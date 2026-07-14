import { getCorsHeaders } from "./auth-cors.ts"

export const genericAuthMessage =
  "Não foi possível continuar com os dados informados."

// For non-preflight responses, use the production origin as default.
// The browser only sends credentials to the origin that matched in the preflight,
// so this is safe — non-matching origins are already rejected by the preflight handler.
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
