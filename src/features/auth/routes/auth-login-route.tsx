import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router"

import { getAuthProfileRole } from "@/app/router/route-auth-utils"
import { getDefaultRouteHrefForRole } from "@/app/router/route-home-utils"
import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"
import { notify } from "@/components/toast"
import { FieldGroup } from "@/components/ui/field"
import { isValidCpf } from "@/lib"

import { authCopy } from "../auth-copy"
import {
  AuthCard,
  AuthCpfField,
  AuthNewPasswordFields,
  AuthPasskeyAction,
  AuthPasswordField,
  AuthSubmitButton,
} from "../components"
import { useAuthFlow, useAuthSession, usePasskey } from "../hooks"
import { useAttemptGuard } from "../hooks/auth-use-attempt-guard"
import {
  authLoginSchema,
  validateAuthLoginSubmission,
  type AuthLoginFormValues,
} from "../schemas"
import { getAuthErrorMessage, submitPasswordCredentials } from "../services"

interface LocationState {
  from?: {
    pathname?: string
  }
}

export function AuthLoginRoute() {
  const flow = useAuthFlow()
  const passkey = usePasskey()
  const guard = useAttemptGuard()
  const credentialsSubmitInFlight = React.useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, refresh } = useAuthSession()

  const form = useForm<AuthLoginFormValues>({
    resolver: zodResolver(authLoginSchema),
    mode: "onSubmit",
    defaultValues: {
      confirmNewPassword: "",
      cpf: "",
      newPassword: undefined,
      password: "",
    },
  })

  const locationState = location.state as LocationState | null
  const redirectTo =
    locationState?.from?.pathname ??
    getDefaultRouteHrefForRole(getAuthProfileRole(profile))
  const cpf = form.watch("cpf")
  const newPassword = form.watch("newPassword") ?? ""
  const confirmNewPassword = form.watch("confirmNewPassword") ?? ""
  const newPasswordError =
    typeof form.formState.errors.newPassword?.message === "string"
      ? form.formState.errors.newPassword.message
      : undefined
  const confirmNewPasswordError =
    typeof form.formState.errors.confirmNewPassword?.message === "string"
      ? form.formState.errors.confirmNewPassword.message
      : undefined
  const cpfIsValid = isValidCpf(cpf)
  const isBusy =
    form.formState.isSubmitting || passkey.isPending || guard.isBlocked
  const shouldShowNewPassword = cpfIsValid && flow.step === "new_password"
  const shouldShowPasskeyRegistration =
    cpfIsValid && flow.step === "passkey_registration"
  const onSubmit = form.handleSubmit((values) => {
    void handleCredentialsSubmit(values)
  })

  async function handleAuthenticatedRedirect() {
    guard.resetAttempts()
    await refresh()
    void navigate(redirectTo, { replace: true })
  }

  async function handleCredentialsSubmit(values: AuthLoginFormValues) {
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

        form.setError(fieldName as keyof AuthLoginFormValues, {
          message,
          type: "validate",
        })
        hasSetFieldError = true
      }

      if (!hasSetFieldError) {
        notify.error(authCopy.feedback.genericAuthError)
      }

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

  async function handlePasskeyLogin() {
    if (guard.isBlocked) {
      return
    }

    try {
      await passkey.authenticate()
      await handleAuthenticatedRedirect()
    } catch (caughtError) {
      guard.recordAttempt()

      notify.error(
        getAuthErrorMessage(caughtError, authCopy.feedback.passkeyAuthError)
      )
    }
  }

  async function handlePasskeyRegistration() {
    try {
      await passkey.createPasskey()
      await handleAuthenticatedRedirect()
    } catch (caughtError) {
      notify.error(
        getAuthErrorMessage(caughtError, authCopy.feedback.passkeyAuthError)
      )
    }
  }

  return (
    <AuthCard
      title={
        <img
          src={montecarloLogo}
          alt="Rede Monte Carlo"
          className="mx-auto h-20 w-auto"
        />
      }
      description={<span className="sr-only">{authCopy.login.title}</span>}
    >
      <form
        onSubmit={(event) => {
          void onSubmit(event)
        }}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="cpf"
            render={({ field, fieldState }) => (
              <AuthCpfField
                id="auth-cpf"
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)

                  if (flow.step !== "credentials") {
                    flow.reset()
                    form.setValue("password", "", {
                      shouldDirty: false,
                      shouldValidate: false,
                    })
                    form.setValue("newPassword", undefined, {
                      shouldDirty: false,
                      shouldValidate: false,
                    })
                    form.setValue("confirmNewPassword", "", {
                      shouldDirty: false,
                      shouldValidate: false,
                    })
                  }
                }}
                disabled={isBusy}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <AuthPasswordField
                id="auth-password"
                label={authCopy.login.passwordLabel}
                labelAction={
                  <Link
                    to="/recuperar-acesso"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {authCopy.login.recoveryLink}
                  </Link>
                }
                value={field.value ?? ""}
                onValueChange={field.onChange}
                disabled={isBusy}
                error={fieldState.error?.message}
              />
            )}
          />

          {shouldShowNewPassword ? (
            <AuthNewPasswordFields
              passwordValue={newPassword}
              confirmValue={confirmNewPassword}
              onPasswordValueChange={(value) =>
                form.setValue("newPassword", value, {
                  shouldDirty: true,
                  shouldValidate: false,
                })
              }
              onConfirmValueChange={(value) =>
                form.setValue("confirmNewPassword", value, {
                  shouldDirty: true,
                  shouldValidate: false,
                })
              }
              passwordError={newPasswordError}
              confirmError={confirmNewPasswordError}
              disabled={isBusy}
              description={authCopy.login.newPasswordDescription}
            />
          ) : null}

          {guard.isLocked ? (
            <p
              role="alert"
              className="text-center text-sm font-medium text-destructive"
            >
              {`Muitas tentativas. Aguarde ${String(guard.remainingSeconds)}s para tentar novamente.`}
            </p>
          ) : null}

          {shouldShowPasskeyRegistration ? (
            <AuthPasskeyAction
              label={authCopy.login.passkeyRegistration}
              isLoading={passkey.isPending}
              disabled={form.formState.isSubmitting || guard.isBlocked}
              onClick={() => {
                void handlePasskeyRegistration()
              }}
            />
          ) : (
            <>
              <AuthSubmitButton
                isLoading={form.formState.isSubmitting}
                disabled={isBusy}
              >
                {authCopy.login.submit}
              </AuthSubmitButton>

              <AuthPasskeyAction
                label={authCopy.login.passkeyLogin}
                variant="secondary"
                isLoading={passkey.isPending}
                disabled={form.formState.isSubmitting || guard.isBlocked}
                onClick={() => {
                  if (guard.isBlocked) {
                    return
                  }

                  void handlePasskeyLogin()
                }}
              />
            </>
          )}
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
