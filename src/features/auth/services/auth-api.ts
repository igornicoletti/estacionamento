import { shouldBypassAuthInDev } from "@/config"
import { onlyDigits } from "@/lib/cpf"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { authCopy } from "../auth-copy"
import {
  type AuthPasswordResponse,
  type RecoveryRequestResponse,
} from "../types"
import { createAuthPublicError } from "./auth-error"

type FunctionBody = Record<string, unknown>

function getAuthFunctionClient() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw createAuthPublicError(
      "AUTH_SUPABASE_NOT_CONFIGURED",
      "getAuthFunctionClient"
    )
  }

  return supabase
}

function normalizeCpfForAuth(cpf: string) {
  return onlyDigits(cpf)
}

async function invokeAuthFunction<TResponse>(
  name: string,
  body: FunctionBody
): Promise<TResponse> {
  const supabase = getAuthFunctionClient()

  let response: {
    data: TResponse | null
    error: unknown
  }

  try {
    response = await supabase.functions.invoke<TResponse>(name, {
      body,
    })
  } catch (caughtError) {
    throw createAuthPublicError("AUTH_GENERIC", `invoke:${name}`, caughtError)
  }

  if (response.error || !response.data) {
    throw createAuthPublicError(
      "AUTH_GENERIC",
      `invoke:${name}:response-error`,
      response.error
    )
  }

  return response.data
}

export function submitPasswordCredentials(input: {
  cpf: string
  password: string
  flowId?: string
  newPassword?: string
}) {
  if (shouldBypassAuthInDev()) {
    return Promise.resolve({
      flowId: input.flowId ?? "dev-auth-flow",
      message: authCopy.feedback.genericAuthError,
      nextAction: input.newPassword ? "register_passkey" : "set_new_password",
    } satisfies AuthPasswordResponse)
  }

  return invokeAuthFunction<AuthPasswordResponse>("auth-password", {
    ...input,
    cpf: normalizeCpfForAuth(input.cpf),
  }).then(async (response) => {
    const supabase = getSupabaseBrowserClient()

    if (response.session && supabase) {
      const { error } = await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token,
      })

      if (error) {
        throw createAuthPublicError(
          "AUTH_GENERIC",
          "submitPasswordCredentials:setSession",
          error
        )
      }
    }

    return response
  })
}

export function requestAccessRecovery(input: {
  cpf: string
  phone: string
  reason: string
  description?: string
}) {
  if (shouldBypassAuthInDev()) {
    return Promise.resolve({
      message: authCopy.feedback.genericRecoveryResponse,
    } satisfies RecoveryRequestResponse)
  }

  return invokeAuthFunction<RecoveryRequestResponse>(
    "auth-recovery-request",
    {
      ...input,
      cpf: normalizeCpfForAuth(input.cpf),
    }
  )
}
