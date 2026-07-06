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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { settingsCopy } from "../settings-copy"
import { type SettingsMfaApp } from "../types/settings-types"

interface SettingsSecurityAddMfaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddApp: (name: string) => Promise<SettingsMfaApp>
}

export function SettingsSecurityAddMfaDialog({
  open,
  onOpenChange,
  onAddApp,
}: SettingsSecurityAddMfaDialogProps) {
  const [appName, setAppName] = React.useState("")
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  function resetState() {
    setAppName("")
    setNameError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetState()
    }
  }

  async function handleAdd() {
    if (!appName.trim()) {
      setNameError(settingsCopy.dialogs.addMfaApp.validation.required)
      return
    }

    setIsSaving(true)

    try {
      await notify.track(onAddApp(appName.trim()), {
        loading: settingsCopy.dialogs.addMfaApp.feedback.loading,
        success: settingsCopy.dialogs.addMfaApp.feedback.success,
        error: settingsCopy.dialogs.addMfaApp.feedback.error,
      })
      handleOpenChange(false)
    } catch {
      return
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settingsCopy.dialogs.addMfaApp.title}</DialogTitle>
          <DialogDescription>{settingsCopy.dialogs.addMfaApp.description}</DialogDescription>
        </DialogHeader>

        <Field data-invalid={Boolean(nameError)}>
          <FieldLabel htmlFor="mfa-app-name">{settingsCopy.dialogs.addMfaApp.inputLabel}</FieldLabel>
          <Input
            id="mfa-app-name"
            className="w-full"
            placeholder={settingsCopy.dialogs.addMfaApp.inputPlaceholder}
            value={appName}
            onChange={(event) => {
              setAppName(event.target.value)
              setNameError(null)
            }}
            disabled={isSaving}
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>

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
              void handleAdd()
            }}
          >
            {settingsCopy.dialogs.addMfaApp.confirmButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
