import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppPasswordField } from "@/components/shared/app-password-field"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AUTH_NEXT_ACTION } from "@/features/auth/contracts"
import { useAuth } from "@/features/auth/context"
import type { AuthPasswordResponse } from "@/features/auth/types"

import { AuthPageCard } from "../components"
import { authCopy } from "../constants"
import {
  authLoginSchema,
  formatCpfInput,
  getFirstIssueByPath,
  type AuthLoginPayload,
  type FieldErrors,
  requiredPasswordSchema,
  type RequiredPasswordValues,
} from "../validation"

interface LocationState {
  from?: {
    pathname?: string
  }
}

type LoginStep = "credentials" | "required-password" | "required-passkey"

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

function getInitialValues(): AuthLoginPayload {
  return {
    cpf: "",
    password: "",
  }
}

function getInitialRequiredPasswordValues(): RequiredPasswordValues {
  return {
    confirmPassword: "",
    newPassword: "",
  }
}

export function AuthLoginRoute() {
  const auth = useAuth()
  const copy = authCopy.login
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const redirectTo = locationState?.from?.pathname ?? appRoutePaths.home
  const [values, setValues] = React.useState<AuthLoginPayload>(getInitialValues)
  const [errors, setErrors] = React.useState<FieldErrors<AuthLoginPayload>>({})
  const [step, setStep] = React.useState<LoginStep>("credentials")
  const [flowId, setFlowId] = React.useState<string | null>(null)
  const [requiredPasswordValues, setRequiredPasswordValues] =
    React.useState<RequiredPasswordValues>(getInitialRequiredPasswordValues)
  const [requiredPasswordErrors, setRequiredPasswordErrors] =
    React.useState<FieldErrors<RequiredPasswordValues>>({})
  const [isPasskeySubmitting, setIsPasskeySubmitting] = React.useState(false)
  const [isExpiredDialogOpen, setIsExpiredDialogOpen] = React.useState(() =>
    auth.inactivity.consumeExpired()
  )
  const isSubmitting = auth.isSubmitting
  const isBusy = isSubmitting || isPasskeySubmitting
  const title =
    step === "required-password"
      ? authCopy.requiredPassword.title
      : step === "required-passkey"
        ? authCopy.passkeyUnavailable.title
        : copy.title
  const description =
    step === "required-password"
      ? authCopy.requiredPassword.description
      : step === "required-passkey"
        ? authCopy.passkeyUnavailable.description
      : copy.description

  function resetPendingFlow() {
    auth.actions.clearRequiredPasswordChallenge()
    setStep("credentials")
    setFlowId(null)
    setRequiredPasswordValues(getInitialRequiredPasswordValues())
    setRequiredPasswordErrors({})
  }

  function updateValue(key: keyof AuthLoginPayload) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value
      const value = key === "cpf" ? formatCpfInput(rawValue) : rawValue

      setValues((current) => ({ ...current, [key]: value }))
      setErrors((current) => ({ ...current, [key]: undefined }))

      if (step !== "credentials") {
        resetPendingFlow()
      }
    }
  }

  function updateRequiredPasswordValue(key: keyof RequiredPasswordValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setRequiredPasswordValues((current) => ({
        ...current,
        [key]: event.target.value,
      }))
      setRequiredPasswordErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  async function finishAuthenticatedFlow() {
    await auth.actions.refreshProfile()
    void navigate(redirectTo, { replace: true })
  }

  async function handlePasswordResponse(response: AuthPasswordResponse) {
    setFlowId(response.flowId)

    if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
      await finishAuthenticatedFlow()
      return
    }

    if (response.nextAction === AUTH_NEXT_ACTION.setNewPassword) {
      setStep("required-password")
      return
    }

    if (response.nextAction === AUTH_NEXT_ACTION.registerPasskey) {
      setStep("required-passkey")
      return
    }

    notify.error(authCopy.errors.unsupportedNextAction)
  }

  async function handleCredentialsSubmit() {
    const parsed = authLoginSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(getFirstIssueByPath(parsed.error.issues))
      return
    }

    setErrors({})

    try {
      const response = await auth.actions.signInWithPassword(parsed.data)
      await handlePasswordResponse(response)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.invalidCredentials
      )
    }
  }

  async function handleRequiredPasswordSubmit() {
    const parsed = requiredPasswordSchema.safeParse(requiredPasswordValues)

    if (!parsed.success) {
      setRequiredPasswordErrors(getFirstIssueByPath(parsed.error.issues))
      return
    }

    setRequiredPasswordErrors({})

    try {
      const response = await auth.actions.completeRequiredPassword(
        parsed.data.newPassword
      )

      if (response.nextAction === AUTH_NEXT_ACTION.registerPasskey) {
        await handlePasswordResponse(response)
        return
      }

      if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
        notify.success(authCopy.requiredPassword.success)
        setValues((current) => ({ ...current, password: "" }))
        resetPendingFlow()
        return
      }

      notify.error(authCopy.errors.unsupportedNextAction)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.invalidCredentials
      )
    }
  }

  async function handleRequiredPasskeySubmit() {
    setIsPasskeySubmitting(true)

    try {
      const response = await auth.actions.registerRequiredPasskey({
        cpf: values.cpf,
        flowId,
      })

      if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
        notify.success(authCopy.passkeyRegistration.success)
        await finishAuthenticatedFlow()
        return
      }

      notify.error(authCopy.errors.passkeyRegistrationFailed)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.passkeyRegistrationFailed
      )
    } finally {
      setIsPasskeySubmitting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (step === "required-password") {
      await handleRequiredPasswordSubmit()
      return
    }

    if (step === "required-passkey") {
      await handleRequiredPasskeySubmit()
      return
    }

    await handleCredentialsSubmit()
  }

  async function handlePasskeySubmit() {
    setIsPasskeySubmitting(true)

    try {
      await auth.actions.signInWithPasskey()
      await finishAuthenticatedFlow()
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.passkeyLoginFailed
      )
    } finally {
      setIsPasskeySubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <AppAlertDialog
        open={isExpiredDialogOpen}
        onOpenChange={setIsExpiredDialogOpen}
        title={authCopy.inactivity.expiredTitle}
        description={authCopy.inactivity.expiredDescription}
        footer={
          <Button
            type="button"
            size="lg"
            onClick={() => setIsExpiredDialogOpen(false)}
          >
            {authCopy.inactivity.expiredAction}
          </Button>
        }
      />

      <AuthPageCard title={title} description={description}>
        <form
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
          noValidate
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.cpf)}>
              <FieldLabel htmlFor="login-cpf">
                {copy.cpfLabel}
                <RequiredMark />
              </FieldLabel>
              <Input
                id="login-cpf"
                value={values.cpf}
                onChange={updateValue("cpf")}
                placeholder={copy.cpfPlaceholder}
                inputMode="numeric"
                autoComplete="username"
                className="h-9"
                disabled={isBusy || step !== "credentials"}
                aria-invalid={Boolean(errors.cpf)}
              />
              {errors.cpf ? <FieldError>{errors.cpf}</FieldError> : null}
            </Field>

            {step === "credentials" ? (
              <Field data-invalid={Boolean(errors.password)}>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="login-password">
                    {copy.passwordLabel}
                    <RequiredMark />
                  </FieldLabel>
                  <Button
                    asChild
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                  >
                    <Link to={appRoutePaths.recovery}>{copy.recoveryAction}</Link>
                  </Button>
                </div>
                <Input
                  id="login-password"
                  value={values.password}
                  onChange={updateValue("password")}
                  placeholder={copy.passwordPlaceholder}
                  type="password"
                  autoComplete="current-password"
                  className="h-9"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password ? <FieldError>{errors.password}</FieldError> : null}
              </Field>
            ) : null}

            {step === "required-password" ? (
              <>
                <AppPasswordField
                  id="login-new-password"
                  label={authCopy.requiredPassword.newPasswordLabel}
                  value={requiredPasswordValues.newPassword}
                  onChange={updateRequiredPasswordValue("newPassword")}
                  autoComplete="new-password"
                  disabled={isBusy}
                  error={requiredPasswordErrors.newPassword}
                />

                <AppPasswordField
                  id="login-confirm-password"
                  label={authCopy.requiredPassword.confirmPasswordLabel}
                  value={requiredPasswordValues.confirmPassword}
                  onChange={updateRequiredPasswordValue("confirmPassword")}
                  autoComplete="new-password"
                  disabled={isBusy}
                  error={requiredPasswordErrors.confirmPassword}
                />
              </>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={isBusy}
              aria-busy={isSubmitting || (step === "required-passkey" && isPasskeySubmitting)}
            >
              {isSubmitting || (step === "required-passkey" && isPasskeySubmitting) ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {step === "required-password"
                ? isSubmitting
                  ? authCopy.requiredPassword.submitting
                  : authCopy.requiredPassword.submit
                : step === "required-passkey"
                  ? isPasskeySubmitting
                    ? authCopy.passkeyRegistration.loading
                    : authCopy.passkeyRegistration.submit
                  : isSubmitting
                    ? copy.submitting
                    : copy.submit}
            </Button>

            {step === "credentials" ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isBusy}
                aria-busy={isPasskeySubmitting}
                onClick={() => {
                  void handlePasskeySubmit()
                }}
              >
                {isPasskeySubmitting ? <Spinner data-icon="inline-start" /> : null}
                {isPasskeySubmitting ? copy.passkeySubmitting : copy.passkeySubmit}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isBusy}
                onClick={resetPendingFlow}
              >
                {authCopy.recovery.backToLogin}
              </Button>
            )}
          </FieldGroup>
        </form>
      </AuthPageCard>
    </main>
  )
}
