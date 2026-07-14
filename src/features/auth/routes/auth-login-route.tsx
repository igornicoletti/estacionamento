import { KeyRoundIcon, LogOutIcon } from "lucide-react"
import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppDialog } from "@/components/shared/app-dialog"
import { AppPasswordField } from "@/components/shared/app-password-field"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AUTH_NEXT_ACTION, useAuth } from "@/features/auth"
import { AuthPageCard } from "@/features/auth/components"
import { authCopy } from "@/features/auth/copy"
import {
  authLoginSchema,
  formatCpfInput,
  getFirstIssueByPath,
  requiredPasswordSchema,
  type FieldErrors,
  type RequiredPasswordValues,
} from "@/features/auth/validation"

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

export function AuthLoginRoute() {
  const auth = useAuth()
  const copy = authCopy.login
  const requiredPasswordCopy = authCopy.requiredPassword
  const [cpf, setCpf] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [loginErrors, setLoginErrors] =
    React.useState<FieldErrors<{ cpf: string; password: string }>>({})
  const [passwordErrors, setPasswordErrors] =
    React.useState<FieldErrors<RequiredPasswordValues>>({})
  const [isExpiredDialogOpen, setIsExpiredDialogOpen] = React.useState(() =>
    auth.inactivity.consumeExpired()
  )
  const [submitMode, setSubmitMode] = React.useState<
    "password" | "passkey" | "register-passkey" | null
  >(null)
  const isPasswordSubmitting =
    auth.isSubmitting &&
    (submitMode === "password" || submitMode === "register-passkey")
  const isPasskeySubmitting = auth.isSubmitting && submitMode === "passkey"

  async function handlePasskeyRegistration(flowId: string | null, cpfValue: string) {
    setSubmitMode("register-passkey")

    try {
      await notify.track(auth.actions.registerRequiredPasskey({
        cpf: cpfValue,
        flowId,
      }),
        {
          loading: authCopy.passkeyRegistration.loading,
          success: authCopy.passkeyRegistration.success,
          error: (caughtError) =>
            caughtError instanceof Error
              ? caughtError.message
              : authCopy.errors.passkeyRegistrationFailed,
        }
      )
      setPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } finally {
      setSubmitMode(null)
    }
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = authLoginSchema.safeParse({ cpf, password })

    if (!parsed.success) {
      setLoginErrors(getFirstIssueByPath(parsed.error.issues))
      return
    }

    setLoginErrors({})
    setSubmitMode("password")

    try {
      const response = await auth.actions.signInWithPassword(parsed.data)

      if (response.nextAction === AUTH_NEXT_ACTION.registerPasskey) {
        await handlePasskeyRegistration(response.flowId, parsed.data.cpf)
        return
      }

      if (
        response.nextAction !== AUTH_NEXT_ACTION.authenticated &&
        response.nextAction !== AUTH_NEXT_ACTION.setNewPassword
      ) {
        notify.warning(response.message || authCopy.errors.unsupportedNextAction)
      }
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.invalidCredentials
      )
    } finally {
      setSubmitMode(null)
    }
  }

  async function handlePasskeyLogin() {
    setSubmitMode("passkey")

    try {
      await auth.actions.signInWithPasskey()
      return
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.passkeyLoginFailed
      )
    } finally {
      setSubmitMode(null)
    }
  }

  async function handleRequiredPasswordSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    const parsed = requiredPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    })

    if (!parsed.success) {
      setPasswordErrors(getFirstIssueByPath(parsed.error.issues))
      return
    }

    setPasswordErrors({})
    setSubmitMode("password")

    try {
      const response = await auth.actions.completeRequiredPassword(
        parsed.data.newPassword
      )

      setPassword("")
      setNewPassword("")
      setConfirmPassword("")

      if (response.nextAction === AUTH_NEXT_ACTION.registerPasskey) {
        await handlePasskeyRegistration(response.flowId, cpf)
        return
      }

      notify.success(requiredPasswordCopy.success)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.invalidCredentials
      )
    } finally {
      setSubmitMode(null)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <AuthPageCard title={copy.title} description={copy.description}>
        <form
          onSubmit={(event) => {
            void handleLoginSubmit(event)
          }}
          noValidate
        >
          <FieldGroup>
            <Field data-invalid={Boolean(loginErrors.cpf)}>
              <FieldLabel htmlFor="auth-cpf">
                {copy.cpfLabel}
                <RequiredMark />
              </FieldLabel>
              <Input
                id="auth-cpf"
                value={cpf}
                onChange={(event) => setCpf(formatCpfInput(event.target.value))}
                placeholder={copy.cpfPlaceholder}
                inputMode="numeric"
                autoComplete="username"
                className="h-9"
                aria-invalid={Boolean(loginErrors.cpf)}
              />
              {loginErrors.cpf ? <FieldError>{loginErrors.cpf}</FieldError> : null}
            </Field>

            <AppPasswordField
              id="auth-password"
              label={copy.passwordLabel}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.passwordPlaceholder}
              error={loginErrors.password}
              labelAction={
                <Button asChild variant="link" size="lg" className="p-0 h-0">
                  <Link to={appRoutePaths.recovery}>{copy.recoveryAction}</Link>
                </Button>
              }
            />

            <Button type="submit" size="lg" disabled={auth.isSubmitting}>
              {isPasswordSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {isPasswordSubmitting ? copy.submitting : copy.submit}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={auth.isSubmitting}
              onClick={() => {
                void handlePasskeyLogin()
              }}
            >
              {isPasskeySubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <KeyRoundIcon aria-hidden="true" />
              )}
              {isPasskeySubmitting ? copy.passkeySubmitting : copy.passkeySubmit}
            </Button>
          </FieldGroup>
        </form>
      </AuthPageCard>

      <AppDialog
        open={auth.passwordChange.required}
        onOpenChange={(open) => {
          if (!open) {
            auth.actions.clearRequiredPasswordChallenge()
          }
        }}
        title={requiredPasswordCopy.title}
        description={requiredPasswordCopy.description}
      >
        <form
          onSubmit={(event) => {
            void handleRequiredPasswordSubmit(event)
          }}
          noValidate
        >
          <FieldGroup>
            <AppPasswordField
              id="auth-new-password"
              label={requiredPasswordCopy.newPasswordLabel}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              error={passwordErrors.newPassword}
            />
            <AppPasswordField
              id="auth-confirm-password"
              label={requiredPasswordCopy.confirmPasswordLabel}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              error={passwordErrors.confirmPassword}
            />
            <Button type="submit" size="lg" disabled={auth.isSubmitting}>
              {isPasswordSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {isPasswordSubmitting
                ? requiredPasswordCopy.submitting
                : requiredPasswordCopy.submit}
            </Button>
          </FieldGroup>
        </form>
      </AppDialog>

      <AppAlertDialog
        open={isExpiredDialogOpen}
        onOpenChange={setIsExpiredDialogOpen}
        media={<LogOutIcon />}
        title={authCopy.inactivity.expiredTitle}
        description={authCopy.inactivity.expiredDescription}
        actionLabel={authCopy.inactivity.expiredAction}
      />

    </main>
  )
}

export default AuthLoginRoute
