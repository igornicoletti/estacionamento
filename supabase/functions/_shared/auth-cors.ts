const ALLOWED_ORIGINS = [
  "https://estacionamento-livid.vercel.app",
  "https://estacionamento.redemontecarlo.com.br",
  "http://localhost:5173",
  "http://localhost:5174",
]

function resolveAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin") ?? ""

  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

export function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  }
}

export function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) })
  }

  return null
}
