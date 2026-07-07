import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { Link } from "react-router"

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
import { useLoginFlow } from "../hooks"
import {
  authLoginSchema,
  authLoginWithNewPasswordSchema,
  type AuthLoginFormValues,
} from "../schemas"

export function AuthLoginRoute() {
  const {
    flow,
    guard,
    passkey,
    handleCredentialsSubmit,
    handlePasskeyLogin,
    handlePasskeyRegistration,
  } = useLoginFlow()

  const shouldShowNewPassword = flow.step === "new_password"
  const activeSchema = shouldShowNewPassword
    ? authLoginWithNewPasswordSchema
    : authLoginSchema

  const form = useForm<AuthLoginFormValues>({
    resolver: zodResolver(activeSchema),
    mode: "onSubmit",
    defaultValues: {
      confirmNewPassword: "",
      cpf: "",
      newPassword: undefined,
      password: "",
    },
  })

  React.useEffect(() => {
    if (shouldShowNewPassword) {
      form.setValue("newPassword", "", {
        shouldDirty: false,
        shouldValidate: false,
      })
    }
  }, [shouldShowNewPassword, form])

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
  const shouldShowPasskeyRegistration =
    cpfIsValid && flow.step === "passkey_registration"
  const submitButtonLabel = shouldShowNewPassword
    ? authCopy.login.firstAccessSubmit
    : authCopy.login.submit
  const submitButtonLoadingText = shouldShowNewPassword
    ? authCopy.login.firstAccessLoading
    : authCopy.login.submitLoading

  const onSubmit = form.handleSubmit(async (values) => {
    await handleCredentialsSubmit(values, (field, error) => {
      form.setError(field, error)
    })
  })

  return (
    <AuthCard
      title={authCopy.login.title}
      description={authCopy.login.description}
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
                void handlePasskeyRegistration(cpf)
              }}
            />
          ) : (
            <>
              <AuthSubmitButton
                isLoading={form.formState.isSubmitting}
                loadingText={submitButtonLoadingText}
                disabled={isBusy}
              >
                {submitButtonLabel}
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

                  void handlePasskeyLogin(cpf)
                }}
              />
            </>
          )}
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
