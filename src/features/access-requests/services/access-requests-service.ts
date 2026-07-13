import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRecoveryRequestRecord,
  type AccessRequestReviewDecision,
  type PendingPhoneChangeRequestRecord,
} from "../types/access-requests-types"
import {
  parsePhoneChangeRequests,
  parseRecoveryRequests,
} from "../utils/access-requests-parsers"

function getSupabaseOrThrow(errorMessage: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(errorMessage)
  }

  return supabase
}

function getReviewErrorMessage(
  kind: "recovery" | "phoneChanges",
  decision: AccessRequestReviewDecision
) {
  return kind === "recovery"
    ? accessRequestsCopy.feedback.recovery[decision].error
    : accessRequestsCopy.feedback.phoneChanges[decision].error
}

export async function listPendingRecoveryRequests(): Promise<
  AccessRecoveryRequestRecord[]
> {
  const supabase = getSupabaseOrThrow(accessRequestsCopy.feedback.loadError)
  const { data, error } = await supabase
    .from("access_recovery_requests")
    .select("id, phone_masked, email, reason, description, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(accessRequestsCopy.feedback.loadError)
  }

  return parseRecoveryRequests(data ?? [])
}

export async function listPendingPhoneChanges(): Promise<
  PendingPhoneChangeRequestRecord[]
> {
  const supabase = getSupabaseOrThrow(accessRequestsCopy.feedback.loadError)
  const { data, error } = await supabase
    .from("app_users")
    .select("id, auth_user_id, name, phone_masked, pending_phone_masked, updated_at")
    .not("pending_phone_masked", "is", null)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(accessRequestsCopy.feedback.loadError)
  }

  return parsePhoneChangeRequests(data ?? [])
}

export async function reviewRecoveryRequest(
  requestId: string,
  decision: AccessRequestReviewDecision,
  reviewReason: string
) {
  const errorMessage = getReviewErrorMessage("recovery", decision)
  const supabase = getSupabaseOrThrow(errorMessage)
  const { error } = await supabase.functions.invoke("admin-recovery-review", {
    body: {
      decision,
      requestId,
      reviewReason,
    },
  })

  if (error) {
    throw new Error(errorMessage)
  }
}

export async function reviewPhoneChange(
  targetUserId: string,
  decision: AccessRequestReviewDecision
) {
  const errorMessage = getReviewErrorMessage("phoneChanges", decision)
  const supabase = getSupabaseOrThrow(errorMessage)
  const { error } = await supabase.functions.invoke("admin-phone-change-review", {
    body: {
      decision,
      targetUserId,
    },
  })

  if (error) {
    throw new Error(errorMessage)
  }
}
