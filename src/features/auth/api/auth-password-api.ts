import {
  AUTH_FUNCTIONS,
  AUTH_NEXT_ACTION,
  type AuthNextAction,
} from "../contracts"
import { authCopy } from "../constants"
import type { AuthPasswordResponse } from "../types"
import type { AuthLoginPayload } from "../validation"
import { AuthApiError } from "./auth-api-error"
import {
  getRequiredString,
  getString,
  getSupabaseOrThrow,
  isRecord,
  setSessionIfPresent,
} from "./auth-api-helpers"

type PasswordFunctionBody = Record<string, unknown>

function normalizePasswordNextAction(value: unknown): AuthNextAction | null {
  const nextAction = getString(value)

  if (nextAction === AUTH_NEXT_ACTION.registerPasskey) {
    return AUTH_NEXT_ACTION.authenticated
  }

  if (
    nextAction === AUTH_NEXT_ACTION.authenticated ||
    nextAction === AUTH_NEXT_ACTION.setNewPassword ||
    nextAction === AUTH_NEXT_ACTION.usePasskey
  ) {
    return nextAction
  }

  return null
}

function mapPasswordResponse(value: unknown): AuthPasswordResponse {
  if (!isRecord(value)) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const nextAction = normalizePasswordNextAction(value.nextAction)

  if (!nextAction) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const session = isRecord(value.session)
    ? {
        access_token: getRequiredString(value.session, "access_token"),
        refresh_token: getRequiredString(value.session, "refresh_token"),
      }
    : undefined

  return {
    flowId: getString(value.flowId),
    message: getString(value.message) ?? "",
    nextAction,
    ...(session ? { session } : {}),
  }
}

async function invokePasswordFunction(body: PasswordFunctionBody) {
  const supabase = getSupabaseOrThrow()
  const passwordResponse = await supabase.functions.invoke(AUTH_FUNCTIONS.password, {
    body,
  })

  if (passwordResponse.error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const response = mapPasswordResponse(passwordResponse.data)

  if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
    await setSessionIfPresent(response.session)
  }

  return response
}

export function signInWithPassword(payload: AuthLoginPayload) {
  return invokePasswordFunction({
    cpf: payload.cpf,
    password: payload.password,
  })
}

export function completeRequiredPassword(input: {
  cpf: string
  currentPassword: string
  flowId: string | null
  newPassword: string
}) {
  return invokePasswordFunction({
    cpf: input.cpf,
    password: input.currentPassword,
    flowId: input.flowId,
    newPassword: input.newPassword,
  })
}
