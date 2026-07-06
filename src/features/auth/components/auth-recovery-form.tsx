import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"

import { notify } from "@/components/toast"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatPhone } from "@/lib"

import { authCopy, recoveryReasonOptions } from "../auth-copy"
import { useAttemptGuard } from "../hooks"
import {
  authRecoverySchema,
  type AuthRecoveryFormValues,
} from "../schemas"
import { getAuthErrorMessage, requestAccessRecovery } from "../services"
import { AuthCpfField } from "./auth-cpf-field"
import { AuthSubmitButton } from "./auth-submit-button"

interface AuthRecoveryFormProps {
  onSuccess?: () => void
}

export function AuthRecoveryForm({ onSuccess }: AuthRecoveryFormProps) {
  const guard = useAttemptGuard()
  const recoverySubmitInFlight = React.useRef(false)
  const form = useForm<AuthRecoveryFormValues>({
    resolver: zodResolver(authRecoverySchema),
    mode: "onSubmit",
    defaultValues: {
      cpf: "",
      description: "",
      phone: "",
      reason: "lost_phone",
    },
  })

  const selectedReason = form.watch("reason")
  const isBusy = form.formState.isSubmitting || guard.isBlocked

  async function handleSubmit(values: AuthRecoveryFormValues) {
    if (guard.isBlocked || recoverySubmitInFlight.current) {
      return
    }

    recoverySubmitInFlight.current = true

    try {
      await requestAccessRecovery(values)
      notify.success(authCopy.feedback.genericRecoveryResponse)
      form.reset()
      onSuccess?.()
    } catch (caughtError) {
      guard.recordAttempt()

      notify.error(
        getAuthErrorMessage(caughtError, authCopy.feedback.genericAuthError)
      )
    } finally {
      recoverySubmitInFlight.current = false
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()

        if (isBusy) {
          return
        }

        void form.handleSubmit(handleSubmit)(event)
      }}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="cpf"
          render={({ field, fieldState }) => (
            <AuthCpfField
              id="recovery-cpf"
              value={field.value}
              onValueChange={field.onChange}
              disabled={isBusy}
              error={fieldState.error?.message}
            />
          )}
        />

        <Field data-invalid={Boolean(form.formState.errors.phone)}>
          <FieldLabel htmlFor="recovery-phone">
            Telefone <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <Input
                id="recovery-phone"
                className="h-9"
                value={field.value}
                onChange={(event) =>
                  field.onChange(formatPhone(event.target.value))
                }
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                disabled={isBusy}
                aria-invalid={Boolean(form.formState.errors.phone)}
              />
            )}
          />
          {form.formState.errors.phone ? (
            <FieldError>{form.formState.errors.phone.message}</FieldError>
          ) : (
            <FieldDescription>
              {authCopy.recovery.phoneDescription}
            </FieldDescription>
          )}
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.reason)}>
          <FieldLabel htmlFor="recovery-reason">
            Motivo <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isBusy}
              >
                <SelectTrigger
                  id="recovery-reason"
                  className="w-full data-[size=default]:h-9"
                  aria-invalid={Boolean(form.formState.errors.reason)}
                >
                  <SelectValue
                    placeholder={authCopy.recovery.reasonPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  {recoveryReasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.reason ? (
            <FieldError>{form.formState.errors.reason.message}</FieldError>
          ) : null}
        </Field>

        {selectedReason === "other" ? (
          <Field data-invalid={Boolean(form.formState.errors.description)}>
            <FieldLabel htmlFor="recovery-description">
              {authCopy.recovery.otherDescriptionLabel}
            </FieldLabel>
            <Textarea
              id="recovery-description"
              disabled={isBusy}
              aria-invalid={Boolean(form.formState.errors.description)}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <FieldError>
                {form.formState.errors.description.message}
              </FieldError>
            ) : null}
          </Field>
        ) : null}

        {guard.isLocked ? (
          <p
            role="alert"
            className="text-center text-sm font-medium text-destructive"
          >
            {`Muitas tentativas. Aguarde ${String(guard.remainingSeconds)}s para tentar novamente.`}
          </p>
        ) : null}

        <AuthSubmitButton
          isLoading={form.formState.isSubmitting}
          loadingText="Enviando"
          disabled={isBusy}
        >
          {authCopy.recovery.submit}
        </AuthSubmitButton>
      </FieldGroup>
    </form>
  )
}
