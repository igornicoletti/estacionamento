import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord, AccessRequestReviewDecision } from "../model"
import { normalizeRecoveryRequests } from "../model"

interface FunctionInvokeResponse {
  error: unknown
}

function getSupabaseOrThrow(errorMessage: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(errorMessage)
  }

  return supabase
}

function getReviewErrorMessage(decision: AccessRequestReviewDecision) {
  return accessRequestsCopy.feedback.recovery[decision].error
}

export async function listPendingRecoveryRequests(): Promise<AccessRecoveryRequestRecord[]> {
  const supabase = getSupabaseOrThrow(accessRequestsCopy.feedback.loadError)
  const { data, error } = await supabase
    .from("access_recovery_requests")
    .select("id, phone_display, phone_masked, email, reason, description, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(accessRequestsCopy.feedback.loadError)
  }

  return normalizeRecoveryRequests(data ?? [])
}

export async function reviewRecoveryRequest(
  requestId: string,
  decision: AccessRequestReviewDecision,
  temporaryPassword?: string
) {
  const errorMessage = getReviewErrorMessage(decision)
  const supabase = getSupabaseOrThrow(errorMessage)
  const response: FunctionInvokeResponse = await supabase.functions.invoke("admin-recovery-review", {
    body: {
      decision,
      requestId,
      ...(decision === "approved" ? { temporaryPassword } : {}),
    },
  })

  if (response.error) {
    throw new Error(errorMessage)
  }
}
