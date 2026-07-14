import { createAdminClient } from "./auth-supabase-admin.ts"

export async function registerRateLimitAttempt(input: {
  bucket: string
  keyHash: string
  maxAttempts: number
  lockMinutes: number
}) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("auth_rate_limits")
    .select("attempts, locked_until")
    .eq("bucket", input.bucket)
    .eq("key_hash", input.keyHash)
    .maybeSingle()

  const lockExpired =
    data?.locked_until &&
    new Date(data.locked_until).getTime() <= Date.now()

  if (
    data?.locked_until &&
    !lockExpired &&
    new Date(data.locked_until).getTime() > Date.now()
  ) {
    return false
  }

  // Reset counter after lock expiry to prevent immediate re-lock
  const baseAttempts = lockExpired ? 0 : Number(data?.attempts ?? 0)
  const attempts = baseAttempts + 1
  const lockedUntil =
    attempts >= input.maxAttempts
      ? new Date(Date.now() + input.lockMinutes * 60_000).toISOString()
      : null

  await supabase.from("auth_rate_limits").upsert({
    attempts,
    bucket: input.bucket,
    key_hash: input.keyHash,
    last_seen_at: new Date().toISOString(),
    locked_until: lockedUntil,
  })

  return !lockedUntil
}

export async function clearRateLimitByKeyHash(input: {
  bucket: string
  keyHash: string
}) {
  const supabase = createAdminClient()

  await supabase
    .from("auth_rate_limits")
    .delete()
    .eq("bucket", input.bucket)
    .eq("key_hash", input.keyHash)
}
