import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRecoveryRequestRecord,
  type AccessRequestReviewDecision,
  type PendingPhoneChangeRequestRecord,
} from "../types/access-requests-types"

type RawRecoveryRequestRow = {
  created_at: string
  description: string | null
  email: string | null
  id: string
  phone_masked: string
  reason: AccessRecoveryRequestRecord["reason"]
}

type RawPendingPhoneChangeRow = {
  auth_user_id: string
  id: string
  name: string
  pending_phone_masked: string
  phone_masked: string | null
  updated_at: string
}

export async function listPendingRecoveryRequests(): Promise<
  AccessRecoveryRequestRecord[]
> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(accessRequestsCopy.feedback.loadError)
  }

  const { data, error } = await supabase
    .from("access_recovery_requests")
    .select("id, phone_masked, email, reason, description, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(accessRequestsCopy.feedback.loadError)
  }

  return ((data ?? []) as RawRecoveryRequestRow[]).map((request) => ({
    createdAt: request.created_at,
    description: request.description,
    email: request.email,
    id: request.id,
    phoneMasked: request.phone_masked,
    reason: request.reason,
  }))
}

export async function listPendingPhoneChanges(): Promise<
  PendingPhoneChangeRequestRecord[]
> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(accessRequestsCopy.feedback.loadError)
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id, auth_user_id, name, phone_masked, pending_phone_masked, updated_at")
    .not("pending_phone_masked", "is", null)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(accessRequestsCopy.feedback.loadError)
  }

  return ((data ?? []) as RawPendingPhoneChangeRow[]).map((request) => ({
    authUserId: request.auth_user_id,
    currentPhoneMasked: request.phone_masked,
    id: request.id,
    name: request.name,
    pendingPhoneMasked: request.pending_phone_masked,
    requestedAt: request.updated_at,
  }))
}

export async function reviewRecoveryRequest(
  requestId: string,
  decision: AccessRequestReviewDecision,
  reviewReason: string
) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(accessRequestsCopy.feedback.recovery[decision].error)
  }

  const response = await supabase.functions.invoke("admin-recovery-review", {
    body: {
      decision,
      requestId,
      reviewReason,
    },
  })
  const { error } = response as { error: unknown }

  if (error) {
    throw new Error(accessRequestsCopy.feedback.recovery[decision].error)
  }
}

export async function reviewPhoneChange(
  targetUserId: string,
  decision: AccessRequestReviewDecision
) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(accessRequestsCopy.feedback.phoneChanges[decision].error)
  }

  const response = await supabase.functions.invoke("admin-phone-change-review", {
    body: {
      decision,
      targetUserId,
    },
  })
  const { error } = response as { error: unknown }

  if (error) {
    throw new Error(accessRequestsCopy.feedback.phoneChanges[decision].error)
  }
}
