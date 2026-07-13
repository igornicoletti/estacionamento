import type { ReactNode } from "react"

import { KeyRoundIcon, ShieldIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getBadgeToneClassName } from "@/lib"

import { settingsCopy } from "../settings-copy"
import type { SettingsSecuritySummary } from "../types/settings-types"

interface SettingsSecuritySectionProps {
  security: SettingsSecuritySummary
}

function SettingsSecurityItem({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsSecuritySection({ security }: SettingsSecuritySectionProps) {
  const hasPasskey = security.passkeyStatus === "active"
  const hasWildcardPermission = security.permissions.includes("*")

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <ShieldIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <CardTitle className="text-base">{settingsCopy.security.sectionTitle}</CardTitle>
          <CardDescription>{settingsCopy.security.sectionDescription}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <SettingsSecurityItem
          title={settingsCopy.security.sessionTitle}
          description={settingsCopy.security.sessionAuthenticated}
        >
          <Badge variant="secondary" className={getBadgeToneClassName("success")}>
            {security.isAuthenticated
              ? settingsCopy.security.sessionAuthenticated
              : settingsCopy.security.sessionAnonymous}
          </Badge>
        </SettingsSecurityItem>

        <SettingsSecurityItem
          title={settingsCopy.security.passkeyTitle}
          description={
            hasPasskey
              ? settingsCopy.security.passkeyActiveDescription
              : settingsCopy.security.passkeyInactiveDescription
          }
        >
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(hasPasskey ? "success" : undefined)}
          >
            {hasPasskey
              ? settingsCopy.security.passkeyActive
              : settingsCopy.security.passkeyInactive}
          </Badge>
        </SettingsSecurityItem>

        <SettingsSecurityItem
          title={settingsCopy.security.permissionsTitle}
          description={settingsCopy.security.permissionsDescription}
        >
          <Badge variant="secondary">
            <KeyRoundIcon aria-hidden="true" />
            {hasWildcardPermission
              ? settingsCopy.security.wildcardPermission
              : settingsCopy.security.permissionsCount(security.permissions.length)}
          </Badge>
        </SettingsSecurityItem>
      </CardContent>
    </Card>
  )
}
