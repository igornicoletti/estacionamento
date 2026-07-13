import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type Decision = "approved" | "denied"

type UnknownRecord = Record<PropertyKey, unknown>

interface Actor {
  authUserId: string
  id: string
  name: string
  role: string
  status: string
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  })
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null
}

function readDecision(value: unknown): Decision | null {
  return value === "approved" || value === "denied" ? value : null
}

function readEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function createAdminClient() {
  return createClient(
    readEnv("SUPABASE_URL"),
    readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

function createUserClient(authorization: string) {
  return createClient(
    readEnv("SUPABASE_URL"),
    readEnv("SUPABASE_ANON_KEY"),
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

async function getActor(request: Request): Promise<Actor | null> {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return null
  }

  const userClient = createUserClient(authorization)
  const userResponse = await userClient.auth.getUser()

  if (userResponse.error || !userResponse.data.user) {
    return null
  }

  const admin = createAdminClient()
  const actorResponse = await admin
    .from("app_users")
    .select("id, auth_user_id, name, role, status")
    .eq("auth_user_id", userResponse.data.user.id)
    .maybeSingle()

  if (actorResponse.error || !actorResponse.data) {
    return null
  }

  const actor = actorResponse.data as UnknownRecord
  const authUserId = readString(actor.auth_user_id)
  const id = readString(actor.id)
  const name = readString(actor.name)
  const role = readString(actor.role)
  const status = readString(actor.status)

  if (!authUserId || !id || !name || !role || !status) {
    return null
  }

  return {
    authUserId,
    id,
    name,
    role,
    status,
  }
}

function canReviewAccessRequests(actor: Actor | null): actor is Actor {
  return (
    actor !== null &&
    actor.status === "active" &&
    (actor.role === "owner" || actor.role === "admin")
  )
}

async function writeAuditEvent(input: {
  actor: Actor
  event: string
  reason: string
  success: boolean
  target: string
}) {
  const admin = createAdminClient()

  await admin
    .from("audit_events")
    .insert({
      actor: input.actor.name,
      actor_user_id: input.actor.authUserId,
      event: input.event,
      metadata: {
        reason: input.reason,
      },
      reason: input.reason,
      scope: "system",
      severity: input.success ? "info" : "warning",
      success: input.success,
      target: input.target,
    })
    .throwOnError()
}

async function safeAudit(input: {
  actor: Actor
  event: string
  reason: string
  success: boolean
  target: string
}) {
  try {
    await writeAuditEvent(input)
  } catch {
    return
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405)
  }

  const actor = await getActor(request)

  if (!canReviewAccessRequests(actor)) {
    return jsonResponse({ message: "Acesso negado" }, 403)
  }

  const body = await request.json().catch(() => null)

  if (!isRecord(body)) {
    return jsonResponse({ message: "Payload inválido" }, 400)
  }

  const requestId = readString(body.requestId)
  const decision = readDecision(body.decision)
  const reviewReason = readString(body.reviewReason)

  if (!requestId || !decision || !reviewReason || reviewReason.length < 10) {
    return jsonResponse({ message: "Payload inválido" }, 400)
  }

  const admin = createAdminClient()
  const status = decision === "approved" ? "approved" : "denied"
  const updateResponse = await admin
    .from("access_recovery_requests")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: actor.authUserId,
      review_reason: reviewReason,
      status,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (updateResponse.error) {
    await safeAudit({
      actor,
      event: "access_recovery_review_failed",
      reason: reviewReason,
      success: false,
      target: requestId,
    })

    return jsonResponse({ message: "Não foi possível revisar a solicitação" }, 400)
  }

  if (!updateResponse.data) {
    return jsonResponse({ message: "Solicitação pendente não encontrada" }, 404)
  }

  await safeAudit({
    actor,
    event: decision === "approved" ? "access_recovery_approved" : "access_recovery_denied",
    reason: reviewReason,
    success: true,
    target: requestId,
  })

  return jsonResponse({ status })
})
