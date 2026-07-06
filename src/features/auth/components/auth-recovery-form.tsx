import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
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
import {
  authRecoverySchema,
  type AuthRecoveryFormValues,
} from "../schemas"
import { getAuthErrorMessage, requestAccessRecovery } from "../services"
import { AuthCpfField } from "./auth-cpf-field"

export function AuthRecoveryForm() {
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

  async function handleSubmit(values: AuthRecoveryFormValues) {
    try {
      await requestAccessRecovery(values)
      notify.success(authCopy.feedback.genericRecoveryResponse)
      form.reset()
    } catch (caughtError) {
      notify.error(
        getAuthErrorMessage(caughtError, authCopy.feedback.genericAuthError)
      )
    }
  }

  return (
    <form
      onSubmit={(event) => {
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
              disabled={form.formState.isSubmitting}
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
                disabled={form.formState.isSubmitting}
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
                disabled={form.formState.isSubmitting}
              >
                <SelectTrigger
                  id="recovery-reason"
                  className="w-full"
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
              disabled={form.formState.isSubmitting}
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

        <Button
          type="submit"

          disabled={form.formState.isSubmitting}
          aria-busy={form.formState.isSubmitting || undefined}
        >
          {form.formState.isSubmitting ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : null}
          {authCopy.recovery.submit}
        </Button>
      </FieldGroup>
    </form>
  )
}
