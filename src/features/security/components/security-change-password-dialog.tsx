import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { AppPasswordField } from "@/components/shared/app-password-field"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { newPasswordSchema } from "@/features/auth/validation"

import { securityCopy } from "../constants/security-copy"

const CHANGE_PASSWORD_FORM_ID = "security-change-password-form"

interface SecurityChangePasswordDialogProps {
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { currentPassword: string; newPassword: string }) => Promise<void>
}

function getPasswordError(value: string) {
  if (!value.trim()) {
    return null
  }

  const result = newPasswordSchema.safeParse(value.trim())
  return result.success ? null : result.error.issues[0]?.message ?? null
}

export function SecurityChangePasswordDialog({
  open,
  isSaving,
  onOpenChange,
  onSubmit,
}: SecurityChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [touched, setTouched] = React.useState({ current: false, new: false, confirm: false })

  const copy = securityCopy.passwordDialog
  const newPasswordError = touched.new ? getPasswordError(newPassword) : null
  const confirmError = touched.confirm && confirmPassword && newPassword !== confirmPassword
    ? copy.mismatch
    : null
  const sameAsCurrentError = touched.new && newPassword && currentPassword && newPassword === currentPassword
    ? copy.sameAsCurrent
    : null

  const canSubmit = Boolean(
    currentPassword.trim() &&
    newPassword.trim() &&
    confirmPassword.trim() &&
    !newPasswordError &&
    !confirmError &&
    !sameAsCurrentError &&
    newPassword === confirmPassword
  )

  function resetForm() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setTouched({ current: false, new: false, confirm: false })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) {
      return
    }

    if (!nextOpen) {
      resetForm()
    }

    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit || isSaving) {
      return
    }

    await onSubmit({
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
    })
    resetForm()
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={copy.title}
      description={copy.description}
      footer={(
        <div className="grid w-full grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="lg" disabled={isSaving} onClick={() => handleOpenChange(false)}>
            {copy.cancel}
          </Button>
          <Button type="submit" form={CHANGE_PASSWORD_FORM_ID} size="lg" disabled={isSaving || !canSubmit} aria-busy={isSaving}>
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {isSaving ? copy.saving : copy.save}
          </Button>
        </div>
      )}
    >
      <form id={CHANGE_PASSWORD_FORM_ID} onSubmit={(event) => { void handleSubmit(event) }} noValidate>
        <FieldGroup>
          <AppPasswordField
            id="security-change-pw-current"
            label={copy.currentLabel}
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value)
              setTouched((state) => ({ ...state, current: true }))
            }}
            disabled={isSaving}
            autoComplete="current-password"
            required
          />
          <AppPasswordField
            id="security-change-pw-new"
            label={copy.newLabel}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value)
              setTouched((state) => ({ ...state, new: true }))
            }}
            error={newPasswordError ?? sameAsCurrentError ?? undefined}
            disabled={isSaving}
            autoComplete="new-password"
            description={copy.hint}
            required
          />
          <AppPasswordField
            id="security-change-pw-confirm"
            label={copy.confirmLabel}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setTouched((state) => ({ ...state, confirm: true }))
            }}
            error={confirmError ?? undefined}
            disabled={isSaving}
            autoComplete="new-password"
            required
          />
        </FieldGroup>
      </form>
    </AppDialog>
  )
}
