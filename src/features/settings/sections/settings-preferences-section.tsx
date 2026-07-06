import { KeyRoundIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

import { settingsCopy } from "../settings-copy"
import { type SettingsProfile } from "../types/settings-types"
import { SettingsPreferencesPasswordDialog } from "./settings-preferences-password-dialog"
import { SettingsPreferencesProfileForm } from "./settings-preferences-profile-form"

interface SettingsPreferencesSectionProps {
  profile: SettingsProfile
  isSaving: boolean
  onSave: (profile: SettingsProfile) => Promise<void>
}

export function SettingsPreferencesSection({
  profile,
  isSaving,
  onSave,
}: SettingsPreferencesSectionProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-6">
      <SettingsPreferencesProfileForm
        profile={profile}
        isSaving={isSaving}
        onSave={onSave}
      />

      <section className="flex flex-col gap-4">
        <div className="rounded-lg border">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <KeyRoundIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium">
              {settingsCopy.identity.sectionTitle}
            </span>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {settingsCopy.identity.sectionDescription}
            </p>

            <div className="flex flex-col gap-3 rounded-md border border-border/50 px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{settingsCopy.identity.credentialsTitle}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {settingsCopy.identity.credentialsDescription}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  setIsPasswordDialogOpen(true)
                }}
              >
                <KeyRoundIcon aria-hidden="true" />
                {settingsCopy.identity.changePasswordButton}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SettingsPreferencesPasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </div>
  )
}
