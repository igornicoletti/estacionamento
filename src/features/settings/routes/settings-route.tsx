import { TriangleAlertIcon } from "lucide-react"

import { PageHeader, PageSection } from "@/components/page"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import { useSettings } from "../hooks/use-settings"
import { SettingsPreferencesSection } from "../sections/settings-preferences-section"
import { SettingsSecuritySection } from "../sections/settings-security-section"
import { settingsCopy } from "../settings-copy"

export function SettingsRoute() {
  const {
    mfaApps,
    profile,
    isSaving,
    addApp,
    removeApp,
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
            key={`${profile.email}-${profile.name}-${profile.phone}`}
            profile={profile}
            isSaving={isSaving}
            onSave={saveProfile}
          />
          {mfaApps.length > 0 ? (
            <Alert variant="default" className="bg-secondary text-secondary-foreground border-0">
              <TriangleAlertIcon className="size-4 shrink-0 text-yellow-500!" aria-hidden="true" />
              <AlertTitle>{settingsCopy.alert.title}</AlertTitle>
              <AlertDescription>
                {settingsCopy.alert.description}
              </AlertDescription>
            </Alert>
          ) : null}
          <SettingsSecuritySection
            mfaApps={mfaApps}
            onAddApp={addApp}
            onRemoveApp={removeApp}
          />

        </>
      ) : null}
    </PageSection>
  )
}
