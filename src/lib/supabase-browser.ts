import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { env, hasSupabaseBrowserEnv } from "@/config"

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserEnv()) {
    return null
  }

  browserClient ??= createClient(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        experimental: {
          passkey: true,
        },
        persistSession: true,
      },
    }
  )

  return browserClient
}
