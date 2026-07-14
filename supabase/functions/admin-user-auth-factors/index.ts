import {
  actorHasPermission,
  authError,
  createAdminClient,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
} from "../_shared/index.ts"

type AuthPasskeyRow = {
  user_id: string
}

function isAuthPasskeyRow(value: unknown): value is AuthPasskeyRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "user_id" in value &&
    typeof value.user_id === "string"
  )
}

Deno.serve(async (request) => {
  const cors = handleCors(request)

  if (cors) {
    return cors
  }

  if (request.method !== "POST") {
    return authError("method_not_allowed", 405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)
    const admin = createAdminClient()

    if (!actor || actor.status !== "active") {
      return authError("unauthorized", 401, request)
    }

    if (!(await actorHasPermission(actor, "users.read", admin))) {
      return authError("forbidden", 403, request)
    }

    const response = await admin
      .schema("auth")
      .from("webauthn_credentials")
      .select("user_id")

    if (response.error) {
      // Supabase Auth passkeys are still beta; keep this enrichment optional so
      // the users grid does not fail when WebAuthn credential metadata is absent.
      console.error("auth_factors_passkey_lookup_unavailable", {
        error: response.error.message,
      })
      return jsonResponse({ ok: true, factors: [] }, 200, request)
    }

    const passkeyCountByUserId = new Map<string, number>()

    for (const row of response.data ?? []) {
      if (!isAuthPasskeyRow(row)) {
        continue
      }

      passkeyCountByUserId.set(
        row.user_id,
        (passkeyCountByUserId.get(row.user_id) ?? 0) + 1
      )
    }

    return jsonResponse(
      {
        ok: true,
        factors: Array.from(passkeyCountByUserId.entries()).map(
          ([auth_user_id, passkey_count]) => ({
            auth_user_id,
            passkey_count,
          })
        ),
      },
      200,
      request
    )
  } catch (error) {
    console.error("auth_factors_request_failed", error)
    return authError("request_failed", 400, request)
  }
})
