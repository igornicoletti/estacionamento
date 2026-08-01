import { type EdgeSupabaseClient } from "./auth-supabase-admin.ts"

export async function revokeAuthUserSessions(
  admin: EdgeSupabaseClient,
  authUserId: string
) {
  const response = await admin.rpc("revoke_auth_user_sessions", {
    p_auth_user_id: authUserId,
  }) as {
    data: number | null
    error: { message?: string } | null
  }

  if (response.error) {
    throw new Error("Não foi possível revogar as sessões anteriores.")
  }

  return response.data ?? 0
}
