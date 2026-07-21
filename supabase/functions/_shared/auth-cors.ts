const defaultAllowedHeaders = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-sync-secret",
].join(", ")

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value)

    if (url.pathname !== "/" || url.search || url.hash) {
      return null
    }

    return url.origin
  } catch {
    return null
  }
}

function parseAllowedOrigins() {
  return new Set((Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .map(normalizeOrigin)
    .filter(Boolean)
  )
}

function resolveAllowedOrigin(req: Request) {
  const rawOrigin = req.headers.get("Origin") ?? req.headers.get("origin") ?? ""
  const origin = rawOrigin ? normalizeOrigin(rawOrigin) : null
  const allowedOrigins = parseAllowedOrigins()

  if (!rawOrigin) {
    return { allowed: true, origin: null }
  }

  if (!origin) {
    console.error("cors_origin_invalid", { origin: rawOrigin })
    return { allowed: false, origin: null }
  }

  if (allowedOrigins.size === 0) {
    console.error("cors_allowed_origins_missing")
    return { allowed: false, origin: null }
  }

  if (!allowedOrigins.has(origin)) {
    console.error("cors_origin_forbidden", { origin })
    return { allowed: false, origin: null }
  }

  return { allowed: true, origin }
}

export function getCorsHeaders(req: Request) {
  const allowedOrigin = resolveAllowedOrigin(req)
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": defaultAllowedHeaders,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }

  if (allowedOrigin.allowed && allowedOrigin.origin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin.origin
  }

  return headers
}

export function handleCors(req: Request) {
  const allowedOrigin = resolveAllowedOrigin(req)

  if (!allowedOrigin.allowed) {
    return new Response(
      JSON.stringify({
        ok: false,
        code: "forbidden",
        message: "Origem não autorizada.",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Vary": "Origin",
        },
        status: 403,
      }
    )
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) })
  }

  return null
}
