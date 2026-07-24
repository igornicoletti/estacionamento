import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router"

import { getAuthProfileRole } from "@/app/router/route-auth-utils"
import { getDefaultRouteHrefForRole } from "@/app/router/route-home-utils"
import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
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
import {
  authLoginSchema,
  authPasswordSchema,
  newPasswordSchema,
  type AuthLoginFormValues,
} from "../schemas"
import { submitPasswordCredentials } from "../services"

interface LocationState {
  from?: {
    pathname?: string
  }
}

export function AuthLoginRoute() {
  const flow = useAuthFlow()
  const passkey = usePasskey()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, refresh } = useAuthSession()

  const form = useForm<AuthLoginFormValues>({
    resolver: zodResolver(authLoginSchema),
    mode: "onSubmit",
    defaultValues: {
      confirmNewPassword: "",
      cpf: "",
      newPassword: "",
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
  const cpfIsValid = isValidCpf(cpf)
  const isBusy = form.formState.isSubmitting || passkey.isPending
  const shouldShowNewPassword = cpfIsValid && flow.step === "new_password"
  const shouldShowPasskeyRegistration =
    cpfIsValid && flow.step === "passkey_registration"

  async function handleAuthenticatedRedirect() {
    await refresh()
    void navigate(redirectTo, { replace: true })
  }

  async function handleCredentialsSubmit(values: AuthLoginFormValues) {
    if (!isValidCpf(values.cpf)) {
      form.setError("cpf", {
        message: authCopy.login.cpfInvalid,
        type: "validate",
      })
      return
    }

    if (!values.password) {
      form.setError("password", {
        message: authCopy.login.passwordRequired,
        type: "required",
      })
      return
    }

    if (flow.step === "new_password") {
      const newPasswordResult = newPasswordSchema.safeParse(values.newPassword)

      if (!newPasswordResult.success) {
        form.setError("newPassword", {
          message: newPasswordResult.error.issues[0]?.message,
          type: "validate",
        })
        return
      }

      if (values.newPassword !== values.confirmNewPassword) {
        form.setError("confirmNewPassword", {
          message: "As senhas não conferem.",
          type: "validate",
        })
        return
      }
    }

    const passwordResult = authPasswordSchema.safeParse(values.password)

    if (!passwordResult.success) {
      form.setError("password", {
        message: passwordResult.error.issues[0]?.message,
        type: "validate",
      })
      return
    }

    try {
      const response = await submitPasswordCredentials({
        cpf: values.cpf,
        flowId: flow.flowId ?? undefined,
        newPassword:
          flow.step === "new_password" ? values.newPassword : undefined,
        password: values.password,
      })

      flow.setFlowId(response.flowId)

      if (response.nextAction === "use_passkey") {
        flow.setStep("passkey")
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
    } catch {
      notify.error(authCopy.feedback.genericAuthError)
    }
  }

  async function handlePasskeyLogin() {
    try {
      await passkey.authenticate()
      await handleAuthenticatedRedirect()
    } catch {
      notify.error(authCopy.feedback.passkeyAuthError)
    }
  }

  async function handlePasskeyRegistration() {
    try {
      await passkey.createPasskey()
      await handleAuthenticatedRedirect()
    } catch {
      notify.error(authCopy.feedback.passkeyAuthError)
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
          void form.handleSubmit(handleCredentialsSubmit)(event)
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
                    form.setValue("newPassword", "", {
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
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-sm"
                    asChild
                  >
                    <Link to="/recuperar-acesso">
                      {authCopy.login.recoveryLink}
                    </Link>
                  </Button>
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
              passwordError={form.formState.errors.newPassword?.message}
              confirmError={form.formState.errors.confirmNewPassword?.message}
              disabled={isBusy}
              description={authCopy.login.newPasswordDescription}
            />
          ) : null}

          {shouldShowPasskeyRegistration ? (
            <AuthPasskeyAction
              label={authCopy.login.passkeyRegistration}
              isLoading={passkey.isPending}
              disabled={form.formState.isSubmitting}
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
                disabled={form.formState.isSubmitting}
                onClick={() => {
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
