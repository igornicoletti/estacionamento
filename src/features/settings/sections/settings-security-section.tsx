import type { ReactNode } from "react"
import * as React from "react"

import {
  KeyRoundIcon,
  ListChecksIcon,
  MonitorIcon,
  ShieldCheckIcon,
  ShieldIcon,
} from "lucide-react"

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

function SettingsSecurityPanel({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-border/60 bg-background p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

function SettingsSessionDetails({ security }: { security: SettingsSecuritySummary }) {
  const copy = settingsCopy.security
  const items = [
    {
      label: copy.sessionBrowser,
      value: security.session.browser,
    },
    {
      label: copy.sessionOperatingSystem,
      value: security.session.operatingSystem,
    },
    {
      label: copy.sessionIp,
      value: security.session.ipAddress ?? copy.sessionUnavailable,
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
        <div key={item.label} className="min-w-0 space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd className="wrap-break-word text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function SettingsPermissionsDetails({
  hasWildcardPermission,
  permissions,
}: {
  hasWildcardPermission: boolean
  permissions: SettingsSecuritySummary["permissions"]
}) {
  if (hasWildcardPermission) {
    return (
      <Badge variant="secondary" className={getBadgeToneClassName("success")}>
        {settingsCopy.security.wildcardPermission}
      </Badge>
    )
  }

  if (permissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {settingsCopy.security.noPermissions}
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      <Badge variant="secondary" className="w-fit">
        {settingsCopy.security.permissionsCount(permissions.length)}
      </Badge>
      <div className="flex flex-wrap gap-1.5">
        {permissions.map((permission) => (
          <code
            key={permission}
            className="rounded-md border border-border/60 bg-muted px-2 py-1 text-xs text-foreground"
          >
            {permission}
          </code>
        ))}
      </div>
    </div>
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
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <SettingsSecurityPanel
            title={settingsCopy.security.credentialsTitle}
            description={settingsCopy.security.credentialsDescription}
            icon={<KeyRoundIcon className="size-4" aria-hidden="true" />}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={getBadgeToneClassName(hasPasskey ? "success" : undefined)}
                >
                  {hasPasskey
                    ? settingsCopy.security.passkeyActive
                    : settingsCopy.security.passkeyInactive}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {settingsCopy.security.passkeyTitle}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {hasPasskey
                  ? settingsCopy.security.passkeyActiveDescription
                  : settingsCopy.security.passkeyInactiveDescription}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full sm:w-fit"
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
          </SettingsSecurityPanel>

          <SettingsSecurityPanel
            title={settingsCopy.security.sessionTitle}
            description={settingsCopy.security.sessionDescription}
            icon={<MonitorIcon className="size-4" aria-hidden="true" />}
          >
            <SettingsSessionDetails security={security} />
          </SettingsSecurityPanel>

          <div className="lg:col-span-2">
            <SettingsSecurityPanel
              title={settingsCopy.security.permissionsTitle}
              description={settingsCopy.security.permissionsDescription}
              icon={<ListChecksIcon className="size-4" aria-hidden="true" />}
            >
              <SettingsPermissionsDetails
                hasWildcardPermission={hasWildcardPermission}
                permissions={security.permissions}
              />
            </SettingsSecurityPanel>
          </div>
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
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheckIcon className="size-4" aria-hidden="true" />
              {settingsCopy.security.passkeyInstructionTitle}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {settingsCopy.security.passkeyInstructionDescription}
            </p>
          </div>
        </div>
      </AppDialog>
    </>
  )
}
