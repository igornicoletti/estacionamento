import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { requestAccessRecovery } from "@/features/auth/api"
import { AuthPageCard } from "@/features/auth/components"
import { authCopy } from "@/features/auth/copy"
import {
  authRecoverySchema,
  formatCpfInput,
  formatPhoneInput,
  getFirstIssueByPath,
  recoveryReasonValues,
  type AuthRecoveryFormValues,
  type FieldErrors,
  type RecoveryReason,
} from "@/features/auth/validation"

const recoveryReasonLabelByValue: Record<RecoveryReason, string> = {
  lost_phone: authCopy.recovery.reasons.lostPhone,
  forgot_password: authCopy.recovery.reasons.forgotPassword,
  attempts_blocked: authCopy.recovery.reasons.attemptsBlocked,
  other: authCopy.recovery.reasons.other,
}

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

function getInitialValues(): AuthRecoveryFormValues {
  return {
    cpf: "",
    phone: "",
    email: "",
    reason: "",
    description: "",
  }
}

export function AuthRecoveryRoute() {
  const copy = authCopy.recovery
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [values, setValues] =
    React.useState<AuthRecoveryFormValues>(getInitialValues)
  const [errors, setErrors] =
    React.useState<FieldErrors<AuthRecoveryFormValues>>({})

  const shouldShowDescription = values.reason === "other"

  function updateTextValue(key: keyof Omit<AuthRecoveryFormValues, "reason">) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const rawValue = event.target.value
      const value =
        key === "cpf"
          ? formatCpfInput(rawValue)
          : key === "phone"
            ? formatPhoneInput(rawValue)
            : rawValue

      setValues((current) => ({ ...current, [key]: value }))
    }
  }

  function updateReasonValue(reason: RecoveryReason) {
    setValues((current) => ({
      ...current,
      reason,
      description: reason === "other" ? current.description : "",
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = authRecoverySchema.safeParse(values)

    if (!parsed.success) {
      setErrors(getFirstIssueByPath(parsed.error.issues))
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      await requestAccessRecovery(parsed.data)
      notify.success(copy.success)
      setValues(getInitialValues())
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : authCopy.errors.recoveryFailed
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <AuthPageCard title={copy.title} description={copy.description}>
        <form
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
          noValidate
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.cpf)}>
              <FieldLabel htmlFor="recovery-cpf">
                {copy.cpfLabel}
                <RequiredMark />
              </FieldLabel>
              <Input
                id="recovery-cpf"
                value={values.cpf}
                onChange={updateTextValue("cpf")}
                inputMode="numeric"
                autoComplete="username"
                className="h-9"
                aria-invalid={Boolean(errors.cpf)}
              />
              {errors.cpf ? <FieldError>{errors.cpf}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(errors.phone)}>
              <FieldLabel htmlFor="recovery-phone">
                {copy.phoneLabel}
                <RequiredMark />
              </FieldLabel>
              <Input
                id="recovery-phone"
                value={values.phone}
                onChange={updateTextValue("phone")}
                inputMode="tel"
                autoComplete="tel"
                className="h-9"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="recovery-email">{copy.emailLabel}</FieldLabel>
              <Input
                id="recovery-email"
                value={values.email}
                onChange={updateTextValue("email")}
                inputMode="email"
                autoComplete="email"
                className="h-9"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <FieldError>{errors.email}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(errors.reason)}>
              <FieldLabel htmlFor="recovery-reason">
                {copy.reasonLabel}
                <RequiredMark />
              </FieldLabel>
              <Select
                value={values.reason || undefined}
                onValueChange={(value) => updateReasonValue(value as RecoveryReason)}
              >
                <SelectTrigger
                  id="recovery-reason"
                  className="h-9 w-full"
                  aria-invalid={Boolean(errors.reason)}
                >
                  <SelectValue placeholder={copy.reasonPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {recoveryReasonValues.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {recoveryReasonLabelByValue[reason]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reason ? <FieldError>{errors.reason}</FieldError> : null}
            </Field>

            {shouldShowDescription ? (
              <Field data-invalid={Boolean(errors.description)}>
                <FieldLabel htmlFor="recovery-description">
                  {copy.descriptionLabel}
                </FieldLabel>
                <Textarea
                  id="recovery-description"
                  value={values.description}
                  onChange={updateTextValue("description")}
                  placeholder={copy.descriptionPlaceholder}
                  maxLength={500}
                  aria-invalid={Boolean(errors.description)}
                />
                {errors.description ? (
                  <FieldError>{errors.description}</FieldError>
                ) : null}
              </Field>
            ) : null}

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {isSubmitting ? copy.submitting : copy.submit}
            </Button>

            <Button asChild variant="link" size="lg">
              <Link to={appRoutePaths.login}>{copy.backToLogin}</Link>
            </Button>
          </FieldGroup>
        </form>
      </AuthPageCard>
    </main>
  )
}

export default AuthRecoveryRoute
