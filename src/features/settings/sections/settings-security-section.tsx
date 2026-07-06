import { ShieldIcon } from "lucide-react"

import { settingsCopy } from "../settings-copy"

interface SettingsSecuritySectionProps {
  mfaStatus: "active" | "inactive"
}

export function SettingsSecuritySection({
  mfaStatus,
}: SettingsSecuritySectionProps) {
  const isActive = mfaStatus === "active"

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
              <span
                className={
                  isActive
                    ? "inline-flex w-fit items-center rounded-full border border-emerald-400 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600"
                    : "inline-flex w-fit items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {isActive ? settingsCopy.mfa.statusActive : settingsCopy.mfa.statusInactive}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
