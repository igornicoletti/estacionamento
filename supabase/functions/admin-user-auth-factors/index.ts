import {
  createAdminClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  requireAdminActor,
} from "../_shared/index.ts"

type AuthFactorRow = {
  user_id: string
}

function isAuthFactorRow(value: unknown): value is AuthFactorRow {
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
    return genericAuthError(405, request)
  }

  try {
    requireAdminActor(await getAuthenticatedActor(request))

    const admin = createAdminClient()
    const response = await admin
      .schema("auth")
      .from("mfa_factors")
      .select("user_id")
      .eq("factor_type", "webauthn")
      .eq("status", "verified")

    if (response.error) {
      return genericAuthError(undefined, request)
    }

    const passkeyCountByUserId = new Map<string, number>()

    for (const row of response.data ?? []) {
      if (!isAuthFactorRow(row)) {
        continue
      }

      passkeyCountByUserId.set(
        row.user_id,
        (passkeyCountByUserId.get(row.user_id) ?? 0) + 1
      )
    }

    return jsonResponse(
      {
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
  } catch {
    return genericAuthError(403, request)
  }
})
