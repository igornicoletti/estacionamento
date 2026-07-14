const defaultAllowedHeaders = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-sync-secret",
].join(", ")

function parseAllowedOrigins() {
  return (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function resolveAllowedOrigin(req: Request) {
  const origin = req.headers.get("Origin") ?? req.headers.get("origin") ?? ""
  const allowedOrigins = parseAllowedOrigins()

  if (allowedOrigins.length === 0) {
    return origin || "*"
  }

  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
}

export function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Headers": defaultAllowedHeaders,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Vary": "Origin",
  }
}

export function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) })
  }

  return null
}
