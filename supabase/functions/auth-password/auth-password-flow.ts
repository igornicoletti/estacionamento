import { createAdminClient } from "../_shared/index.ts"

import {
  passwordFlowSeconds,
  type AppUserRow,
  type PasswordFlowPurpose,
} from "./auth-password-contracts.ts"

export async function createPasswordFlow(input: {
  appUserId: string
  cpfHash: string
  purpose: PasswordFlowPurpose
}) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("internal_create_password_task", {
    p_app_user_id: input.appUserId,
    p_cpf_hmac: input.cpfHash,
    p_purpose: input.purpose,
    p_ttl_seconds: passwordFlowSeconds,
  }) as {
    data: string | null
    error: { message?: string } | null
  }

  if (error || !data) {
    if (error) {
      console.error("password_flow_creation_failed", { error: error.message })
    }

    throw new Error("Não foi possível iniciar o fluxo.")
  }

  return data
}

export async function claimPasswordFlow(input: {
  appUserId: string
  claimToken: string
  cpfHash: string
  flowId: string
}) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("internal_claim_password_task", {
    p_app_user_id: input.appUserId,
    p_claim_token: input.claimToken,
    p_cpf_hmac: input.cpfHash,
    p_flow_id: input.flowId,
  }) as {
    data: boolean | null
    error: { message?: string } | null
  }

  if (error) {
    console.error("password_flow_claim_failed", { error: error.message })
  }

  return data === true && !error
}

export async function releasePasswordFlowClaim(input: {
  appUserId: string
  claimToken: string
  flowId: string
}) {
  const admin = createAdminClient()
  const { error } = await admin.rpc("internal_release_password_task_claim", {
    p_app_user_id: input.appUserId,
    p_claim_token: input.claimToken,
    p_flow_id: input.flowId,
  })

  if (error) {
    console.error("password_flow_claim_release_failed", { error: error.message })
  }
}

export type PasswordTaskCompletionResult =
  | "completed"
  | "not_completed"
  | "unknown"

async function reconcilePasswordTask(input: {
  appUserId: string
  claimToken: string
  flowId: string
}): Promise<PasswordTaskCompletionResult> {
  const admin = createAdminClient()
  const [flowResponse, appUserResponse] = await Promise.all([
    admin
      .from("auth_flow_attempts")
      .select("claim_token, consumed_at")
      .eq("flow_id", input.flowId)
      .eq("app_user_id", input.appUserId)
      .maybeSingle(),
    admin
      .from("app_users")
      .select("status")
      .eq("id", input.appUserId)
      .maybeSingle(),
  ])

  if (flowResponse.error || appUserResponse.error) {
    return "unknown"
  }

  const flow = flowResponse.data as {
    claim_token: string | null
    consumed_at: string | null
  } | null
  const appUser = appUserResponse.data as { status: string } | null

  if (!flow || !appUser) {
    return "unknown"
  }

  if (flow.consumed_at && appUser.status === "active") {
    return "completed"
  }

  if (!flow.consumed_at && flow.claim_token === input.claimToken) {
    return "not_completed"
  }

  return "unknown"
}

export async function completePasswordTask(input: {
  appUserId: string
  claimToken: string
  cpfHash: string
  flowId: string
}): Promise<PasswordTaskCompletionResult> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("internal_complete_password_task", {
    p_app_user_id: input.appUserId,
    p_claim_token: input.claimToken,
    p_cpf_hmac: input.cpfHash,
    p_flow_id: input.flowId,
  }) as {
    data: boolean | null
    error: { message?: string } | null
  }

  if (!error) {
    return data === true ? "completed" : "not_completed"
  }

  console.error("password_task_completion_failed", { error: error.message })

  return reconcilePasswordTask(input)
}

export async function findAppUser(cpfHash: string): Promise<AppUserRow | null> {
  const admin = createAdminClient()
  const response = await admin
    .from("app_users")
    .select("id, auth_user_id, technical_email, name, status, locked_until")
    .eq("cpf_hmac", cpfHash)
    .maybeSingle()

  if (response.error || !response.data) {
    return null
  }

  return response.data as AppUserRow
}
