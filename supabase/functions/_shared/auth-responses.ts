import { getCorsHeaders } from "./auth-cors.ts"

export const genericAuthMessage =
  "Não foi possível continuar com os dados informados."

// For non-preflight responses, use the production origin as default.
// The browser only sends credentials to the origin that matched in the preflight,
// so this is safe — non-matching origins are already rejected by the preflight handler.
const defaultResponseHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "https://estacionamento-livid.vercel.app",
}

export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  req?: Request
) {
  const headers = req ? getCorsHeaders(req) : defaultResponseHeaders

  return new Response(JSON.stringify(body), {
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    status,
  })
}

export function genericAuthError(status = 400, req?: Request) {
  return jsonResponse({ message: genericAuthMessage }, status, req)
}
