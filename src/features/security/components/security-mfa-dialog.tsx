import {
  CopyIcon,
  KeyRoundIcon,
  MessageSquareIcon,
  SmartphoneIcon,
} from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { notify } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { securityCopy } from "../constants/security-copy"
import { securityMfaCodeSchema } from "../schemas/security-mfa-schema"
import { type SecurityMfaEnrollment } from "../types/security-types"

const MFA_FORM_ID = "security-mfa-form"
type MfaPhase = "method" | "setup" | "verify"
type MfaMethod = "totp" | "sms"

export function SecurityMfaDialog({
  enrollment,
  error,
  isSaving,
  onClose,
  onEnroll,
  onReset,
  onVerify,
  open,
}: {
  enrollment: SecurityMfaEnrollment | null
  error?: string | null
  isSaving: boolean
  onClose: () => void | Promise<void>
  onEnroll: () => Promise<boolean>
  onReset: () => Promise<boolean>
  onVerify: (code: string) => void | Promise<void>
  open: boolean
}) {
  const [code, setCode] = React.useState("")
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<MfaPhase>("method")
  const [method, setMethod] = React.useState<MfaMethod>("totp")
  const copy = securityCopy.mfaDialog
  const codeError = validationError ?? error

  async function handleContinueMethod() {
    if (method !== "totp") {
      return
    }

    setPhase("setup")

    if (!await onEnroll()) {
      setPhase("method")
    }
  }

  async function handleBack() {
    if (phase === "verify") {
      setCode("")
      setValidationError(null)
      setPhase("setup")
      return
    }

    if (await onReset()) {
      setCode("")
      setValidationError(null)
      setPhase("method")
    }
  }

  async function handleCopySecret() {
    if (!enrollment) {
      return
    }

    try {
      await navigator.clipboard.writeText(enrollment.secret)
      notify.success(copy.secretCopied)
    } catch {
      notify.error(copy.secretCopyError)
    }
  }

  function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = securityMfaCodeSchema.safeParse(code)

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? copy.invalidCode)
      return
    }

    setValidationError(null)
    void onVerify(parsed.data)
  }

  const footer = (
    <div className="grid w-full grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={isSaving}
        onClick={() => {
          if (phase === "method") {
            void onClose()
            return
          }

          void handleBack()
        }}
      >
        {phase === "method" ? copy.cancel : copy.back}
      </Button>
      {phase === "method" ? (
        <Button
          key="method-continue"
          type="button"
          size="lg"
          disabled={isSaving || method !== "totp"}
          onClick={() => void handleContinueMethod()}
        >
          {isSaving ? <Spinner data-icon="inline-start" /> : null}
          {isSaving ? copy.preparing : copy.continue}
        </Button>
      ) : phase === "setup" ? (
        <Button
          key="setup-continue"
          type="button"
          size="lg"
          disabled={isSaving || !enrollment}
          onClick={() => setPhase("verify")}
        >
          {copy.continue}
        </Button>
      ) : (
        <Button
          key="verify-enable"
          type="submit"
          form={MFA_FORM_ID}
          size="lg"
          disabled={isSaving}
        >
          {isSaving ? <Spinner data-icon="inline-start" /> : null}
          {isSaving ? copy.enabling : copy.enable}
        </Button>
      )}
    </div>
  )

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) {
          void onClose()
        }
      }}
      title={copy.title}
      description={copy.description}
      bodyClassName="overflow-x-hidden"
      footer={footer}
    >
      {phase === "method" ? (
        <section className="flex flex-col gap-4" aria-labelledby="mfa-method-title">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 id="mfa-method-title" className="text-sm font-medium">
              {copy.methodTitle}
            </h3>
            <p className="text-balance text-sm text-muted-foreground">
              {copy.methodDescription}
            </p>
          </div>
          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-auto min-w-0 items-start justify-start whitespace-normal p-4 text-left aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary aria-pressed:hover:bg-primary/15 aria-pressed:hover:text-primary"
              disabled={isSaving}
              aria-pressed={method === "totp"}
              onClick={() => setMethod("totp")}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input",
                  method === "totp" && "border-primary"
                )}
              >
                {method === "totp" ? (
                  <span className="size-2 rounded-full bg-primary" />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <SmartphoneIcon aria-hidden="true" />
                  <span>{copy.authenticatorTitle}</span>
                  <Badge
                    variant={method === "totp" ? "outline" : "secondary"}
                    className={cn(
                      method === "totp" && "border-primary/40 text-primary"
                    )}
                  >
                    {copy.recommended}
                  </Badge>
                </span>
                <span
                  className={cn(
                    "text-xs font-normal text-muted-foreground",
                    method === "totp" && "text-primary/80"
                  )}
                >
                  {copy.authenticatorDescription}
                </span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-w-0 items-start justify-start whitespace-normal p-4 text-left"
              disabled
              aria-describedby="mfa-sms-description"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 rounded-full border border-input"
              />
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <MessageSquareIcon aria-hidden="true" />
                  <span>{copy.smsTitle}</span>
                  <Badge variant="outline">{copy.comingSoon}</Badge>
                </span>
                <span
                  id="mfa-sms-description"
                  className="text-xs font-normal text-muted-foreground"
                >
                  {copy.smsDescription}
                </span>
              </span>
            </Button>
          </div>
        </section>
      ) : null}

      {phase === "setup" ? (
        <section className="flex min-w-0 flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-sm font-medium">{copy.setupTitle}</h3>
            <p className="text-balance text-sm text-muted-foreground">
              {copy.setupDescription}
            </p>
          </div>
          {enrollment ? (
            <>
              <div className="flex w-full justify-center bg-muted/30 p-4">
                <img
                  src={enrollment.qrCode}
                  alt={copy.qrCodeAlt}
                  className="size-40 bg-white p-2"
                />
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2 text-left">
                <p className="text-center text-xs text-muted-foreground">
                  {copy.secretDescription}
                </p>
                <div className="flex min-w-0 items-center justify-center gap-2 bg-muted/30 px-3 py-2">
                  <code className="min-w-0 truncate font-mono text-sm">
                    {enrollment.secret}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 text-muted-foreground"
                    aria-label={copy.copySecret}
                    onClick={() => void handleCopySecret()}
                  >
                    <CopyIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-52 items-center justify-center">
              <Spinner aria-label={copy.preparing} />
            </div>
          )}
        </section>
      ) : null}

      {phase === "verify" ? (
        <form
          id={MFA_FORM_ID}
          className="flex min-w-0 flex-col items-center gap-5 text-center"
          onSubmit={handleVerify}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <KeyRoundIcon aria-hidden="true" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-sm font-medium">{copy.verifyTitle}</h3>
            <p className="text-balance text-sm text-muted-foreground">
              {copy.verifyDescription}
            </p>
          </div>
          <Field data-invalid={Boolean(codeError)} className="w-full items-center">
            <FieldLabel htmlFor="security-mfa-code" className="sr-only">
              {copy.codeLabel}
            </FieldLabel>
            <InputOTP
              id="security-mfa-code"
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              placeholder="000000"
              value={code}
              onChange={(value) => {
                const nextCode = value.replace(/\D/gu, "")
                setCode(nextCode)

                if (validationError) {
                  const parsed = securityMfaCodeSchema.safeParse(nextCode)
                  setValidationError(
                    parsed.success
                      ? null
                      : parsed.error.issues[0]?.message ?? copy.invalidCode
                  )
                }
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-invalid={Boolean(codeError)}
              disabled={isSaving}
              containerClassName="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
            >
              <InputOTPGroup className="grid min-w-0 grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => (
                  <span key={index} className="relative min-w-0">
                    <InputOTPSlot
                      index={index}
                      aria-invalid={Boolean(codeError)}
                      className="h-9 w-full rounded-md border-0 bg-muted/50 shadow-none first:rounded-md first:border-l-0 last:rounded-md"
                    />
                    {code.length <= index ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/40"
                      >
                        0
                      </span>
                    ) : null}
                  </span>
                ))}
              </InputOTPGroup>
              <InputOTPSeparator className="text-muted-foreground" />
              <InputOTPGroup className="grid min-w-0 grid-cols-3 gap-2">
                {[3, 4, 5].map((index) => (
                  <span key={index} className="relative min-w-0">
                    <InputOTPSlot
                      index={index}
                      aria-invalid={Boolean(codeError)}
                      className="h-9 w-full rounded-md border-0 bg-muted/50 shadow-none first:rounded-md first:border-l-0 last:rounded-md"
                    />
                    {code.length <= index ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/40"
                      >
                        0
                      </span>
                    ) : null}
                  </span>
                ))}
              </InputOTPGroup>
            </InputOTP>
            {codeError ? <FieldError>{codeError}</FieldError> : null}
          </Field>
        </form>
      ) : null}
    </AppDialog>
  )
}
