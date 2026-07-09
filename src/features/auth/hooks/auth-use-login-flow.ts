import * as React from "react"
import { useLocation, useNavigate } from "react-router"

import { getAuthProfileRole } from "@/app/router/route-auth-utils"
import { getDefaultRouteHrefForRole } from "@/app/router/route-home-utils"
import { notify } from "@/components/toast"

import { authCopy } from "../auth-copy"
import { useAuthSession } from "../context/auth-session-context"
import {
  type AuthLoginFormValues,
  validateAuthLoginSubmission,
} from "../schemas"
import {
  getAuthErrorMessage,
  startAuthFlow,
  submitPasswordCredentials,
} from "../services"
import { useAttemptGuard } from "./auth-use-attempt-guard"
import { useAuthFlow } from "./auth-use-flow"
import { usePasskey } from "./auth-use-passkey"

interface LocationState {
  from?: {
    pathname?: string
  }
}

export function useLoginFlow() {
  const flow = useAuthFlow()
  const passkey = usePasskey()
  const guard = useAttemptGuard()
  const credentialsSubmitInFlight = React.useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, refresh } = useAuthSession()

  const locationState = location.state as LocationState | null
  const redirectTo =
    locationState?.from?.pathname ??
    getDefaultRouteHrefForRole(getAuthProfileRole(profile)) ??
    "/"

  async function handleAuthenticatedRedirect() {
    guard.resetAttempts()
    await refresh()
    void navigate(redirectTo, { replace: true })
  }

  async function handleCredentialsSubmit(
    values: AuthLoginFormValues,
    setFieldError: (
      field: keyof AuthLoginFormValues,
      error: { message: string; type: string }
    ) => void
  ) {
    if (guard.isBlocked || credentialsSubmitInFlight.current) {
      return
    }

    credentialsSubmitInFlight.current = true

    const requiresNewPassword = flow.step === "new_password"
    const validationResult = validateAuthLoginSubmission(
      values,
      requiresNewPassword
    )

    if (!validationResult.success) {
      const { fieldErrors } = validationResult.error.flatten()
      let hasSetFieldError = false

      for (const [fieldName, messages] of Object.entries(fieldErrors)) {
        const message = messages?.[0]

        if (!message) {
          continue
        }

        setFieldError(fieldName as keyof AuthLoginFormValues, {
          message,
          type: "validate",
        })
        hasSetFieldError = true
      }

      if (!hasSetFieldError) {
        notify.error(authCopy.feedback.genericAuthError)
      }

      credentialsSubmitInFlight.current = false
      return
    }

    const sanitizedInput = validationResult.data
    const nextNewPassword =
      requiresNewPassword && typeof values.newPassword === "string"
        ? values.newPassword
        : undefined

    try {
      const response = await submitPasswordCredentials({
        cpf: sanitizedInput.cpf,
        flowId: flow.flowId ?? undefined,
        newPassword: nextNewPassword,
        password: sanitizedInput.password,
      })

      flow.setFlowId(response.flowId)

      if (response.nextAction === "use_passkey") {
        flow.setStep("passkey")
        notify.info(response.message)
        return
      }

      if (response.nextAction === "set_new_password") {
        flow.setStep("new_password")
        return
      }

      if (response.nextAction === "register_passkey") {
        flow.setStep("passkey_registration")
        return
      }

      flow.setStep("authenticated")
      await handleAuthenticatedRedirect()
    } catch (caughtError) {
      guard.recordAttempt()

      notify.error(
        getAuthErrorMessage(caughtError, authCopy.feedback.genericAuthError)
      )
    } finally {
      credentialsSubmitInFlight.current = false
    }
  }

  async function ensureFlowId(cpf: string) {
    if (flow.flowId) {
      return flow.flowId
    }

    const response = await startAuthFlow(cpf)
    flow.setFlowId(response.flowId)
    return response.flowId
  }

  async function handlePasskeyLogin(cpf: string) {
    if (guard.isBlocked) {
      return
    }

    try {
      const flowId = await ensureFlowId(cpf)
      await passkey.authenticate({ cpf, flowId })
      await handleAuthenticatedRedirect()
    } catch (caughtError) {
      guard.recordAttempt()

      notify.error(
        getAuthErrorMessage(caughtError, authCopy.feedback.passkeyAuthError)
      )
    }
  }

  async function handlePasskeyRegistration(cpf: string) {
    try {
      const flowId = await ensureFlowId(cpf)
      await passkey.createPasskey({ cpf, flowId })
      await handleAuthenticatedRedirect()
    } catch (caughtError) {
      notify.error(
        getAuthErrorMessage(caughtError, authCopy.feedback.passkeyAuthError)
      )
    }
  }

  return {
    flow,
    guard,
    passkey,
    handleCredentialsSubmit,
    handlePasskeyLogin,
    handlePasskeyRegistration,
  }
}
