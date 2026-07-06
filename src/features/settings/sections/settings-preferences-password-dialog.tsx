import * as React from "react"

import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import {
  AuthPasswordField,
  changeProfilePassword,
  getAuthErrorMessage,
} from "@/features/auth"

import { settingsCopy } from "../settings-copy"

interface SettingsPreferencesPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PasswordFieldKey = "current" | "newPwd" | "confirm"

export function SettingsPreferencesPasswordDialog({
  open,
  onOpenChange,
}: SettingsPreferencesPasswordDialogProps) {
  const [current, setCurrent] = React.useState("")
  const [newPwd, setNewPwd] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<Record<PasswordFieldKey, string>>>({})

  function resetState() {
    setCurrent("")
    setNewPwd("")
    setConfirm("")
    setErrors({})
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetState()
    }
  }

  function validate() {
    const nextErrors: Partial<Record<PasswordFieldKey, string>> = {}

    if (!current) {
      nextErrors.current = settingsCopy.dialogs.changePassword.validation.currentRequired
    }

    if (!newPwd) {
      nextErrors.newPwd = settingsCopy.dialogs.changePassword.validation.newRequired
    }

    if (!confirm) {
      nextErrors.confirm = settingsCopy.dialogs.changePassword.validation.confirmRequired
    }

    if (newPwd && confirm && newPwd !== confirm) {
      nextErrors.confirm = settingsCopy.dialogs.changePassword.validation.mismatch
    }

    return nextErrors
  }

  async function handleSave() {
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)

    try {
      await notify.track(
        changeProfilePassword({
          currentPassword: current,
          newPassword: newPwd,
        }),
        {
          loading: settingsCopy.dialogs.changePassword.feedback.loading,
          success: settingsCopy.dialogs.changePassword.feedback.success,
          error: (error) =>
            getAuthErrorMessage(
              error,
              settingsCopy.dialogs.changePassword.feedback.error
            ),
        }
      )
      handleOpenChange(false)
    } catch {
      // Error feedback already surfaced via notify.track above.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settingsCopy.dialogs.changePassword.title}</DialogTitle>
          <DialogDescription>
            {settingsCopy.dialogs.changePassword.description}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <AuthPasswordField
            id="change-pwd-current"
            label={settingsCopy.dialogs.changePassword.fields.current}
            value={current}
            onValueChange={(value) => {
              setCurrent(value)
              setErrors((state) => ({ ...state, current: undefined }))
            }}
            error={errors.current}
            disabled={isSaving}
            autoComplete="current-password"
          />

          <AuthPasswordField
            id="change-pwd-new"
            label={settingsCopy.dialogs.changePassword.fields.newPassword}
            value={newPwd}
            onValueChange={(value) => {
              setNewPwd(value)
              setErrors((state) => ({ ...state, newPwd: undefined }))
            }}
            error={errors.newPwd}
            disabled={isSaving}
            autoComplete="new-password"
          />

          <AuthPasswordField
            id="change-pwd-confirm"
            label={settingsCopy.dialogs.changePassword.fields.confirm}
            value={confirm}
            onValueChange={(value) => {
              setConfirm(value)
              setErrors((state) => ({ ...state, confirm: undefined }))
            }}
            error={errors.confirm}
            disabled={isSaving}
            autoComplete="new-password"
          />
        </FieldGroup>

        <DialogFooter className="grid grid-cols-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              {settingsCopy.dialogs.cancel}
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="w-full"
            disabled={isSaving}
            onClick={() => {
              void handleSave()
            }}
          >
            {settingsCopy.dialogs.changePassword.confirmButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
