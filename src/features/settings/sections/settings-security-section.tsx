import type { ReactNode } from "react"
import * as React from "react"

import { KeyRoundIcon, ShieldIcon } from "lucide-react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import { settingsCopy } from "../settings-copy"
import type {
  SettingsSecuritySummary,
  SettingsSnapshot,
} from "../types/settings-types"

interface SettingsSecuritySectionProps {
  isRegisteringPasskey?: boolean
  onRegisterPasskey: SettingsSnapshot["registerPasskey"]
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
    <div className="grid gap-3 rounded-md border border-border/50 p-3">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function SettingsSessionDetails({ security }: { security: SettingsSecuritySummary }) {
  const copy = settingsCopy.security
  const items = [
    {
      label: copy.sessionIp,
      value: security.session.ipAddress ?? copy.sessionUnavailable,
    },
    {
      label: copy.sessionBrowser,
      value: security.session.browser,
    },
    {
      label: copy.sessionOperatingSystem,
      value: security.session.operatingSystem,
    },
    {
      label: copy.sessionAuthenticatedAt,
      value: security.session.authenticatedAt
        ? formatDateTime(security.session.authenticatedAt)
        : copy.sessionUnavailable,
    },
  ]

  if (!security.isAuthenticated) {
    return <p className="text-sm text-muted-foreground">{copy.sessionAnonymous}</p>
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 rounded-md bg-secondary/60 p-3">
          <dt className="text-xs font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd className="break-words text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SettingsSecuritySection({
  isRegisteringPasskey = false,
  onRegisterPasskey,
  security,
}: SettingsSecuritySectionProps) {
  const hasPasskey = security.passkeyStatus === "active"
  const hasWildcardPermission = security.permissions.includes("*")
  const [registeredPasskey, setRegisteredPasskey] = React.useState<
    Awaited<ReturnType<SettingsSnapshot["registerPasskey"]>> | null
  >(null)

  async function handleRegisterPasskey() {
    const passkey = await onRegisterPasskey()
    setRegisteredPasskey(passkey)
  }

  return (
    <>
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
            description={settingsCopy.security.sessionDescription}
          >
            <SettingsSessionDetails security={security} />
          </SettingsSecurityItem>

          <SettingsSecurityItem
            title={settingsCopy.security.passkeyTitle}
            description={
              hasPasskey
                ? settingsCopy.security.passkeyActiveDescription
                : settingsCopy.security.passkeyInactiveDescription
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={getBadgeToneClassName(hasPasskey ? "success" : undefined)}
              >
                {hasPasskey
                  ? settingsCopy.security.passkeyActive
                  : settingsCopy.security.passkeyInactive}
              </Badge>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isRegisteringPasskey}
                onClick={() => {
                  void handleRegisterPasskey()
                }}
              >
                <KeyRoundIcon aria-hidden="true" />
                {isRegisteringPasskey
                  ? settingsCopy.security.passkeyActivating
                  : settingsCopy.security.passkeyActivate}
              </Button>
            </div>
          </SettingsSecurityItem>

          <SettingsSecurityItem
            title={settingsCopy.security.permissionsTitle}
            description={settingsCopy.security.permissionsDescription}
          >
            <span className="text-sm text-foreground">
              {hasWildcardPermission
                ? settingsCopy.security.wildcardPermission
                : settingsCopy.security.permissionsCount(security.permissions.length)}
            </span>
          </SettingsSecurityItem>
        </CardContent>
      </Card>

      <AppDialog
        open={Boolean(registeredPasskey)}
        onOpenChange={(open) => {
          if (!open) {
            setRegisteredPasskey(null)
          }
        }}
        title={settingsCopy.security.passkeyDialogTitle}
        description={settingsCopy.security.passkeyDialogDescription}
        footer={(
          <Button
            type="button"
            size="lg"
            onClick={() => setRegisteredPasskey(null)}
          >
            {settingsCopy.security.passkeyDialogClose}
          </Button>
        )}
      >
        <div className="grid gap-4">
          <dl className="grid gap-3">
            <div className="grid gap-1">
              <dt className="text-xs font-medium text-muted-foreground">
                {settingsCopy.security.passkeyName}
              </dt>
              <dd className="text-sm text-foreground">
                {registeredPasskey?.friendlyName || "Passkey do dispositivo"}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs font-medium text-muted-foreground">
                {settingsCopy.security.passkeyCreatedAt}
              </dt>
              <dd className="text-sm text-foreground">
                {formatDateTime(registeredPasskey?.createdAt)}
              </dd>
            </div>
          </dl>
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-sm font-medium">
              {settingsCopy.security.passkeyInstructionTitle}
            </p>
            <p className="mt-1 text-sm">
              {settingsCopy.security.passkeyInstructionDescription}
            </p>
          </div>
        </div>
      </AppDialog>
    </>
  )
}
