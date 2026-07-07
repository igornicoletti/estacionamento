import { ShieldIcon } from "lucide-react"

import { notify } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBadgeToneClassName } from "@/lib/badge"

import { settingsCopy } from "../settings-copy"

interface SettingsSecuritySectionProps {
  mfaStatus: "active" | "inactive"
  isEnablingMfa: boolean
  onEnableMfa: () => Promise<void>
}

export function SettingsSecuritySection({
  mfaStatus,
  isEnablingMfa,
  onEnableMfa,
}: SettingsSecuritySectionProps) {
  const isActive = mfaStatus === "active"

  function handleEnableMfa() {
    return notify.promise(onEnableMfa(), {
      loading: settingsCopy.mfa.enableFeedback.loading,
      success: settingsCopy.mfa.enableFeedback.success,
      error: (error) =>
        error instanceof Error
          ? error.message
          : settingsCopy.mfa.enableFeedback.error,
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
              {settingsCopy.mfa.sectionTitle}
            </span>
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
            >
              {isActive ? settingsCopy.mfa.statusActive : settingsCopy.mfa.statusInactive}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {settingsCopy.mfa.sectionDescription}
            </p>

            <div className="flex flex-col gap-3 rounded-md border border-border/50 px-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{settingsCopy.mfa.statusLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? settingsCopy.mfa.statusActiveDescription
                    : settingsCopy.mfa.statusInactiveDescription}
                </p>
              </div>
              {!isActive ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={isEnablingMfa}
                  onClick={() => {
                    void handleEnableMfa()
                  }}
                >
                  <ShieldIcon aria-hidden="true" />
                  {settingsCopy.mfa.enableButton}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
