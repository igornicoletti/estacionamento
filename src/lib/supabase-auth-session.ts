import type { SupabaseClient } from "@supabase/supabase-js"

export async function getValidatedSupabaseAccessToken(
  supabase: SupabaseClient
) {
  const sessionResponse = await supabase.auth.getSession()
  const accessToken = sessionResponse.data.session?.access_token

  if (sessionResponse.error || !accessToken) {
    return null
  }

  const userResponse = await supabase.auth.getUser(accessToken)

  if (userResponse.error || !userResponse.data.user) {
    return null
  }

  return accessToken
}
