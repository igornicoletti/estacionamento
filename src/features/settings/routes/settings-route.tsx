import type { ReactNode } from "react"
import * as React from "react"

import {
  AlertTriangleIcon,
  RefreshCcwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { PageHeader, PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  const {
    error,
    isLoading,
    profile,
    refreshProfile,
    registerPasskey,
    saveProfile,
    security,
    uploadAvatarFile,
  } = useSettings()
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isRegisteringPasskey, setIsRegisteringPasskey] = React.useState(false)

  async function handleSaveProfile(
    input: Parameters<typeof saveProfile>[0],
    avatarFile: File | null
  ) {
    setIsSavingProfile(true)

    try {
      await notify.track((async () => {
        const avatarUrl = avatarFile
          ? await uploadAvatarFile(avatarFile)
          : input.avatarUrl

        await saveProfile({
          ...input,
          avatarUrl,
        })
      })(), settingsCopy.feedback.profile)
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleRegisterPasskey() {
    setIsRegisteringPasskey(true)

    try {
      return await notify.track(registerPasskey(), settingsCopy.feedback.passkey)
    } finally {
      setIsRegisteringPasskey(false)
    }
  }

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

  if (error && !profile) {
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
    <PageSection className="flex-none pb-4">
      <PageHeader title={settingsCopy.page.title} subtitle={settingsCopy.page.subtitle} />
      <div className="grid gap-4">
        {error ? (
          <Alert className="border-destructive/30 bg-destructive/5 text-foreground">
            <AlertTriangleIcon className="text-destructive" aria-hidden="true" />
            <AlertTitle>{settingsCopy.error.noticeTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <SettingsProfileSection
          key={[
            profile.id,
            profile.name,
            profile.email ?? "",
            profile.phoneMasked ?? "",
            profile.avatarPath ?? "",
            profile.avatarUrl ?? "",
          ].join(":")}
          profile={profile}
          isSaving={isSavingProfile}
          onSave={handleSaveProfile}
        />
        <SettingsSecuritySection
          security={security}
          isRegisteringPasskey={isRegisteringPasskey}
          onRegisterPasskey={handleRegisterPasskey}
        />
        <Alert className="w-full border-0 bg-secondary text-foreground">
          <ShieldCheckIcon className="text-primary" aria-hidden="true" />
          <AlertTitle>{settingsCopy.audit.readOnlyTitle}</AlertTitle>
          <AlertDescription className="text-foreground">
            {settingsCopy.audit.readOnlyDescription}
          </AlertDescription>
        </Alert>
      </div>
    </PageSection>
  )
}
