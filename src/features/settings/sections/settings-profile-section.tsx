import { UserIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { settingsCopy } from "../settings-copy"
import type { SettingsProfileSummary } from "../types/settings-types"
import {
  resolveDisplayValue,
  resolveProfileCpf,
  resolveProfileEmail,
  resolveProfilePhone,
  resolveProfileRole,
} from "../utils/settings-models"

interface SettingsProfileSectionProps {
  profile: SettingsProfileSummary
}

function SettingsProfileField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-border/50 px-3 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
    </div>
  )
}

export function SettingsProfileSection({ profile }: SettingsProfileSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <UserIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <CardTitle className="text-base">{settingsCopy.profile.sectionTitle}</CardTitle>
          <CardDescription>{settingsCopy.profile.sectionDescription}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SettingsProfileField label={settingsCopy.profile.fields.name} value={profile.name} />
          <SettingsProfileField
            label={settingsCopy.profile.fields.cpf}
            value={resolveProfileCpf(profile.cpfMasked)}
          />
          <SettingsProfileField
            label={settingsCopy.profile.fields.email}
            value={resolveProfileEmail(profile.email)}
          />
          <SettingsProfileField
            label={settingsCopy.profile.fields.phone}
            value={resolveProfilePhone(profile.phoneMasked)}
          />
          <SettingsProfileField
            label={settingsCopy.profile.fields.role}
            value={resolveProfileRole(profile.roleLabel)}
          />
          <SettingsProfileField
            label={settingsCopy.profile.fields.unit}
            value={resolveDisplayValue(profile.unitLabel)}
          />
          <SettingsProfileField
            label={settingsCopy.profile.fields.status}
            value={profile.status}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
