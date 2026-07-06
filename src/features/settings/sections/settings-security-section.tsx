import { ShieldIcon } from "lucide-react"
import * as React from "react"

import { notify } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog"

import { settingsCopy } from "../settings-copy"
import { type SettingsMfaApp } from "../types/settings-types"
import { SettingsSecurityAddMfaDialog } from "./settings-security-add-mfa-dialog"

interface SettingsSecuritySectionProps {
  mfaApps: SettingsMfaApp[]
  onAddApp: (name: string) => Promise<SettingsMfaApp>
  onRemoveApp: (id: string) => Promise<void>
}

export function SettingsSecuritySection({
  mfaApps,
  onAddApp,
  onRemoveApp,
}: SettingsSecuritySectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)

  function handleOpenAddDialog() {
    setIsAddDialogOpen(true)
  }

  function handleRemoveApp(app: SettingsMfaApp) {
    return notify.promise(onRemoveApp(app.id), {
      loading: settingsCopy.mfa.removeFeedback.loading,
      success: settingsCopy.mfa.removeFeedback.success,
      error: settingsCopy.mfa.removeFeedback.error,
    })
  }

  const appCount = mfaApps.length

  return (
    <div className="flex flex-col gap-6">
      {/* MFA section */}
      <section className="flex flex-col gap-4">
        <div className="rounded-lg border">
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <ShieldIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium">
              {settingsCopy.mfa.sectionTitle}
            </span>
            {appCount > 0 ? (
              <Badge
                variant="outline"
                className="text-xs tracking-wide text-emerald-600 border-emerald-400 bg-emerald-50"
              >
                {appCount} {appCount === 1
                  ? settingsCopy.mfa.configuredLabelSingle
                  : settingsCopy.mfa.configuredLabelPlural}
              </Badge>
            ) : null}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {settingsCopy.mfa.sectionDescription}
            </p>

            {mfaApps.length > 0 ? (
              <div className="flex flex-col divide-y rounded-md border">
                {mfaApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                  >
                    <span>
                      <span className="text-muted-foreground">{settingsCopy.mfa.deviceLabel}: </span>
                      <span className="font-medium">{app.name}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {settingsCopy.mfa.addedAtLabel} {app.addedAt}
                    </span>
                    <DestructiveConfirmDialog
                      title={settingsCopy.mfa.removeDialog.title}
                      description={settingsCopy.mfa.removeDialog.description.replace("{{name}}", app.name)}
                      confirmLabel={settingsCopy.mfa.removeDialog.confirmLabel}
                      onConfirm={() => {
                        handleRemoveApp(app)
                      }}
                      trigger={
                        <Button type="button" variant="outline">
                          {settingsCopy.mfa.removeButton}
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t px-4 py-3">
            <Button
              type="button"
              variant="default"
              onClick={handleOpenAddDialog}
            >
              {settingsCopy.mfa.addButton}
            </Button>
          </div>
        </div>
      </section>

      <SettingsSecurityAddMfaDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddApp={onAddApp}
      />
    </div>
  )
}
