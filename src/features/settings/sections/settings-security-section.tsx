import { ShieldIcon } from "lucide-react"

import { notify } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBadgeToneClassName } from "@/lib/badge"

import { settingsCopy } from "../settings-copy"

interface SettingsSecuritySectionProps {
  passkeyStatus: "active" | "inactive"
  isRegisteringPasskey: boolean
  onRegisterPasskey: () => Promise<void>
}

export function SettingsSecuritySection({
  passkeyStatus,
  isRegisteringPasskey,
  onRegisterPasskey,
}: SettingsSecuritySectionProps) {
  const isActive = passkeyStatus === "active"

  function handleRegisterPasskey() {
    return notify.promise(onRegisterPasskey(), {
      loading: settingsCopy.passkey.enableFeedback.loading,
      success: settingsCopy.passkey.enableFeedback.success,
      error: (error) =>
        error instanceof Error
          ? error.message
          : settingsCopy.passkey.enableFeedback.error,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="rounded-lg border">
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <ShieldIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium">
              {settingsCopy.passkey.sectionTitle}
            </span>
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
            >
              {isActive ? settingsCopy.passkey.statusActive : settingsCopy.passkey.statusInactive}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {settingsCopy.passkey.sectionDescription}
            </p>

            <div className="flex flex-col gap-3 rounded-md border border-border/50 px-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{settingsCopy.passkey.statusLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? settingsCopy.passkey.statusActiveDescription
                    : settingsCopy.passkey.statusInactiveDescription}
                </p>
              </div>
              {!isActive ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={isRegisteringPasskey}
                  onClick={() => {
                    void handleRegisterPasskey()
                  }}
                >
                  <ShieldIcon aria-hidden="true" />
                  {settingsCopy.passkey.enableButton}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
