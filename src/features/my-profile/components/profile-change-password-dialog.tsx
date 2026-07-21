import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { AppPasswordField } from "@/components/shared/app-password-field"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { newPasswordSchema } from "@/features/auth/validation"

import { myProfileCopy } from "../my-profile-copy"

const CHANGE_PASSWORD_FORM_ID = "change-password-form"

interface ProfileChangePasswordDialogProps {
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

export function ProfileChangePasswordDialog({
  open,
  isSaving,
  onOpenChange,
  onSubmit,
}: ProfileChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [touched, setTouched] = React.useState({ current: false, new: false, confirm: false })

  const newPasswordError = touched.new ? getPasswordError(newPassword) : null
  const confirmError = touched.confirm && confirmPassword && newPassword !== confirmPassword
    ? myProfileCopy.changePassword.mismatch
    : null
  const sameAsCurrentError = touched.new && newPassword && currentPassword && newPassword === currentPassword
    ? myProfileCopy.changePassword.sameAsCurrent
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

  React.useEffect(() => {
    if (!open) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTouched({ current: false, new: false, confirm: false })
    }
  }, [open])

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) {
      return
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
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={myProfileCopy.changePassword.title}
      description={myProfileCopy.changePassword.description}
      footer={(
        <div className="grid w-full grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="lg" disabled={isSaving} onClick={() => handleOpenChange(false)}>
            {myProfileCopy.changePassword.cancel}
          </Button>
          <Button type="submit" form={CHANGE_PASSWORD_FORM_ID} size="lg" disabled={isSaving || !canSubmit} aria-busy={isSaving}>
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {isSaving ? myProfileCopy.changePassword.saving : myProfileCopy.changePassword.save}
          </Button>
        </div>
      )}
    >
      <form id={CHANGE_PASSWORD_FORM_ID} onSubmit={(event) => { void handleSubmit(event) }} noValidate>
        <FieldGroup>
          <AppPasswordField
            id="change-pw-current"
            label={myProfileCopy.changePassword.currentLabel}
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value)
              setTouched((t) => ({ ...t, current: true }))
            }}
            disabled={isSaving}
            autoComplete="current-password"
            required
          />
          <AppPasswordField
            id="change-pw-new"
            label={myProfileCopy.changePassword.newLabel}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value)
              setTouched((t) => ({ ...t, new: true }))
            }}
            error={newPasswordError ?? sameAsCurrentError ?? undefined}
            disabled={isSaving}
            autoComplete="new-password"
            description={myProfileCopy.changePassword.hint}
            required
          />
          <AppPasswordField
            id="change-pw-confirm"
            label={myProfileCopy.changePassword.confirmLabel}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setTouched((t) => ({ ...t, confirm: true }))
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
