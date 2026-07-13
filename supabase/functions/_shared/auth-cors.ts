const defaultAllowedHeaders = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
].join(", ")

function parseAllowedOrigins() {
  return (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function getCorsHeaders(request: Request) {
  const origin = request.headers.get("Origin") ?? "*"
  const allowedOrigins = parseAllowedOrigins()
  const allowOrigin =
    allowedOrigins.length === 0 || allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return {
    "Access-Control-Allow-Headers": defaultAllowedHeaders,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
  }
}

export function handleCors(request: Request) {
  if (request.method !== "OPTIONS") {
    return null
  }

  return new Response("ok", {
    headers: getCorsHeaders(request),
  })
}
