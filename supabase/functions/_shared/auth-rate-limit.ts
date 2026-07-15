import { createAdminClient } from "./auth-supabase-admin.ts"

export async function registerRateLimitAttempt(input: {
  bucket: string
  keyHash: string
  maxAttempts: number
  lockMinutes: number
}) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc("internal_consume_auth_rate_limit", {
    p_bucket: input.bucket,
    p_key_hash: input.keyHash,
    p_lock_minutes: input.lockMinutes,
    p_max_attempts: input.maxAttempts,
  }) as {
    data: Array<{ allowed: boolean }> | null
    error: { message?: string } | null
  }

  if (error) {
    console.error("rate_limit_rpc_failed", { error: error.message })
    return false
  }

  return data?.[0]?.allowed === true
}

export async function clearRateLimitByKeyHash(input: {
  bucket: string
  keyHash: string
}) {
  const supabase = createAdminClient()

  await supabase.rpc("internal_clear_auth_rate_limit", {
    p_bucket: input.bucket,
    p_key_hash: input.keyHash,
  })
}
