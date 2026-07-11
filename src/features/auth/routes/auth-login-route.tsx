import { LogOutIcon } from "lucide-react"
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
import { AuthPageCard } from "@/features/auth/components"
import { AUTH_NEXT_ACTION } from "@/features/auth"
import { authCopy } from "@/features/auth/copy"
import { useAuth } from "@/features/auth"
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
  const [isPasskeyBlockedDialogOpen, setIsPasskeyBlockedDialogOpen] =
    React.useState(false)

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = authLoginSchema.safeParse({ cpf, password })

    if (!parsed.success) {
      setLoginErrors(getFirstIssueByPath(parsed.error.issues))
      return
    }

    setLoginErrors({})

    try {
      const response = await auth.actions.signInWithPassword(parsed.data)

      if (response.nextAction === AUTH_NEXT_ACTION.registerPasskey) {
        setIsPasskeyBlockedDialogOpen(true)
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

    try {
      const response = await auth.actions.completeRequiredPassword(
        parsed.data.newPassword
      )

      setPassword("")
      setNewPassword("")
      setConfirmPassword("")

      if (response.nextAction === AUTH_NEXT_ACTION.registerPasskey) {
        setIsPasskeyBlockedDialogOpen(true)
        return
      }

      notify.success(requiredPasswordCopy.success)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.invalidCredentials
      )
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
                <Button asChild variant="link" size="sm">
                  <Link to={appRoutePaths.recovery}>{copy.recoveryAction}</Link>
                </Button>
              }
            />

            <Button type="submit" size="lg" disabled={auth.isSubmitting}>
              {auth.isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {auth.isSubmitting ? copy.submitting : copy.submit}
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
              {auth.isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {auth.isSubmitting
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

      <AppAlertDialog
        open={isPasskeyBlockedDialogOpen}
        onOpenChange={setIsPasskeyBlockedDialogOpen}
        media={<LogOutIcon />}
        title={authCopy.passkeyUnavailable.title}
        description={authCopy.passkeyUnavailable.description}
        actionLabel={authCopy.passkeyUnavailable.action}
      />
    </main>
  )
}

export default AuthLoginRoute
