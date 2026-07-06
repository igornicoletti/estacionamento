import { PageHeader, PageSection } from "@/components/page"

import { useSettings } from "../hooks/use-settings"
import { SettingsPreferencesSection } from "../sections/settings-preferences-section"
import { SettingsSecuritySection } from "../sections/settings-security-section"
import { settingsCopy } from "../settings-copy"

export function SettingsRoute() {
  const {
    mfaStatus,
    profile,
    isSaving,
    saveProfile,
  } = useSettings()

  return (
    <PageSection>
      <PageHeader
        title={settingsCopy.page.title}
        subtitle={settingsCopy.page.subtitle}
      />

      {profile ? (
        <>
          <SettingsPreferencesSection
            key={`${profile.cpf}-${profile.email}-${profile.name}-${profile.phone}`}
            profile={profile}
            isSaving={isSaving}
            onSave={saveProfile}
          />
          <SettingsSecuritySection mfaStatus={mfaStatus} />
        </>
      ) : null}
    </PageSection>
  )
}
