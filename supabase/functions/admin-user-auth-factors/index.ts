import {
  createAdminClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
} from "../_shared/index.ts"

type PasskeyListResponse = {
  data?: unknown
  error?: unknown
}

type AdminPasskeyApi = {
  listPasskeys?: (input: { userId: string }) => Promise<PasskeyListResponse>
}

function requireUserReadActor(
  actor: Awaited<ReturnType<typeof getAuthenticatedActor>>
) {
  if (!actor || actor.status !== "active") {
    throw new Error("Unauthorized")
  }

  if (!["owner", "admin", "auditor"].includes(actor.role)) {
    throw new Error("Forbidden")
  }

  return actor
}

function countPasskeys(data: unknown) {
  if (Array.isArray(data)) {
    return data.length
  }

  if (data && typeof data === "object" && "passkeys" in data) {
    const passkeys = (data as { passkeys?: unknown }).passkeys

    return Array.isArray(passkeys) ? passkeys.length : 0
  }

  return 0
}

async function listPasskeyCount(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const admin = supabase.auth.admin as unknown as { passkey?: AdminPasskeyApi }
  const listPasskeys = admin.passkey?.listPasskeys

  if (!listPasskeys) {
    return 0
  }

  const { data, error } = await listPasskeys.call(admin.passkey, { userId })

  if (error) {
    throw error
  }

  return countPasskeys(data)
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    requireUserReadActor(await getAuthenticatedActor(req))

    const supabase = createAdminClient()
    const { data: users, error } = await supabase
      .from("app_users")
      .select("auth_user_id, phone_verified_at, email_verified_at")

    if (error) {
      return genericAuthError(undefined, req)
    }

    const factors = await Promise.all(
      (users ?? []).map(async (user) => {
        const authUserId = String(user.auth_user_id)
        const passkeyCount = await listPasskeyCount(supabase, authUserId)

        return {
          auth_user_id: authUserId,
          has_verified_mfa_factor: Boolean(
            user.phone_verified_at || user.email_verified_at
          ),
          passkey_count: passkeyCount,
        }
      })
    )

    return jsonResponse({ factors }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
