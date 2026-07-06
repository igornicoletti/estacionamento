import { corsHeaders } from "./auth-cors.ts"

export const genericAuthMessage =
  "Não foi possível continuar com os dados informados."

export function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  })
}

export function genericAuthError(status = 400) {
  return jsonResponse({ message: genericAuthMessage }, status)
}
