import type { ReactNode } from "react"

import { AlertTriangleIcon, RefreshCcwIcon, ShieldAlertIcon } from "lucide-react"

import { PageHeader, PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import { useSettings } from "../hooks/use-settings"
import { settingsCopy } from "../settings-copy"
import { SettingsProfileSection } from "../sections/settings-profile-section"
import { SettingsSecuritySection } from "../sections/settings-security-section"

function SettingsCenteredState({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-64 flex-1 items-center justify-center rounded-lg border bg-background p-6 text-foreground">
      {children}
    </section>
  )
}

export function SettingsRoute() {
  const { error, isLoading, profile, refreshProfile, security } = useSettings()

  if (isLoading) {
    return (
      <PageSection>
        <PageHeader title={settingsCopy.page.title} subtitle={settingsCopy.page.subtitle} />
        <SettingsCenteredState>
          <Spinner className="size-6 text-primary" aria-label={settingsCopy.loading.profile} />
        </SettingsCenteredState>
      </PageSection>
    )
  }

  if (error) {
    return (
      <PageSection>
        <PageHeader title={settingsCopy.page.title} subtitle={settingsCopy.page.subtitle} />
        <SettingsCenteredState>
          <AppEmptyState
            className="mx-auto max-w-xl"
            media={<AlertTriangleIcon />}
            title={settingsCopy.error.title}
            description={error}
            actions={
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  void refreshProfile()
                }}
              >
                <RefreshCcwIcon aria-hidden="true" />
                {settingsCopy.error.action}
              </Button>
            }
          />
        </SettingsCenteredState>
      </PageSection>
    )
  }

  if (!profile) {
    return (
      <PageSection>
        <PageHeader title={settingsCopy.page.title} subtitle={settingsCopy.page.subtitle} />
        <SettingsCenteredState>
          <AppEmptyState
            className="mx-auto max-w-xl"
            media={<ShieldAlertIcon />}
            title={settingsCopy.empty.title}
            description={settingsCopy.empty.description}
            actions={
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  void refreshProfile()
                }}
              >
                <RefreshCcwIcon aria-hidden="true" />
                {settingsCopy.empty.action}
              </Button>
            }
          />
        </SettingsCenteredState>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageHeader title={settingsCopy.page.title} subtitle={settingsCopy.page.subtitle} />
      <div className="grid gap-4">
        <SettingsProfileSection profile={profile} />
        <SettingsSecuritySection security={security} />
        <AppEmptyState
          media={<ShieldAlertIcon />}
          title={settingsCopy.audit.readOnlyTitle}
          description={settingsCopy.audit.readOnlyDescription}
        />
      </div>
    </PageSection>
  )
}
