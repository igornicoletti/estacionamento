import type { ReactNode } from "react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import { securityCopy } from "../security-copy"
import type { SecuritySnapshot, SecuritySummary } from "../types/security-types"

interface SecuritySummaryCardProps {
  isRegisteringPasskey?: boolean
  onRegisterPasskey: SecuritySnapshot["registerPasskey"]
  security: SecuritySummary
}

function SectionRow({
  title,
  description,
  actions,
}: {
  title: string
  description: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(220px,320px)_1fr] md:items-start">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">{actions}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

export function SecuritySummaryCard({
  isRegisteringPasskey = false,
  onRegisterPasskey,
  security,
}: SecuritySummaryCardProps) {
  const hasPasskey = security.passkeyStatus === "active"
  const hasWildcardPermission = security.permissions.includes("*")
  const [registeredPasskey, setRegisteredPasskey] = React.useState<Awaited<ReturnType<SecuritySnapshot["registerPasskey"]>> | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [rotatePasskey, setRotatePasskey] = React.useState(false)

  async function handleRegisterPasskey() {
    const passkey = await onRegisterPasskey()
    setRegisteredPasskey(passkey)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{securityCopy.section.title}</CardTitle>
          <CardDescription>{securityCopy.section.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SectionRow
            title={securityCopy.passkey.title}
            description={hasPasskey ? securityCopy.passkey.activeDescription : securityCopy.passkey.inactiveDescription}
            actions={
              <>
                <Badge variant="secondary" className={getBadgeToneClassName(hasPasskey ? "success" : undefined)}>
                  {hasPasskey ? securityCopy.passkey.active : securityCopy.passkey.inactive}
                </Badge>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
                  {securityCopy.editDialog.title}
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={isRegisteringPasskey} onClick={() => { void handleRegisterPasskey() }}>
                  {isRegisteringPasskey ? <Spinner data-icon="inline-start" /> : null}
                  {isRegisteringPasskey ? securityCopy.passkey.activating : securityCopy.passkey.activate}
                </Button>
              </>
            }
          />

          <Separator />

          <SectionRow
            title={securityCopy.session.title}
            description={securityCopy.page.subtitle}
            actions={
              <div className="grid w-full gap-2 sm:grid-cols-2">
                <Row label={securityCopy.session.browser} value={security.session.browser} />
                <Row label={securityCopy.session.operatingSystem} value={security.session.operatingSystem} />
                <Row label={securityCopy.session.ip} value={security.session.ipAddress ?? securityCopy.session.unavailable} />
                <Row label={securityCopy.session.authenticatedAt} value={security.session.authenticatedAt ? formatDateTime(security.session.authenticatedAt) : securityCopy.session.unavailable} />
              </div>
            }
          />

          <Separator />

          <SectionRow
            title={securityCopy.permissions.title}
            description={securityCopy.section.description}
            actions={
              hasWildcardPermission ? (
                <Badge variant="secondary" className={getBadgeToneClassName("success")}>{securityCopy.permissions.wildcard}</Badge>
              ) : security.permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{securityCopy.permissions.none}</p>
              ) : (
                <>
                  <Badge variant="secondary" className="w-fit">{securityCopy.permissions.count(security.permissions.length)}</Badge>
                  <div className="flex flex-wrap gap-1.5">
                    {security.permissions.map((permission) => (
                      <code key={permission} className="rounded-md border border-border/60 bg-muted px-2 py-1 text-xs text-foreground">{permission}</code>
                    ))}
                  </div>
                </>
              )
            }
          />

          <Separator />

          <SectionRow
            title="Acessos anteriores"
            description="Histórico recente de autenticação para conferência de atividade."
            actions={
              <div className="grid w-full gap-2">
                <p className="text-xs text-muted-foreground">
                  Sessões anteriores são encerradas automaticamente por inatividade. Revogação manual não é necessária neste ambiente.
                </p>
                <div className="rounded-md bg-muted/30 px-3 py-2 text-sm text-foreground">
                  Último acesso: {security.session.authenticatedAt ? formatDateTime(security.session.authenticatedAt) : securityCopy.session.unavailable}
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      <AppDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)

          if (!open) {
            setRotatePasskey(false)
          }
        }}
        title={securityCopy.editDialog.title}
        description={securityCopy.editDialog.description}
        footerClassName="grid grid-cols-2 gap-2"
        footer={
          <>
            <Button type="button" variant="outline" size="lg" className="w-full" disabled={isRegisteringPasskey} onClick={() => setIsEditOpen(false)}>
              {securityCopy.editDialog.cancel}
            </Button>
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={isRegisteringPasskey}
              onClick={() => {
                void (async () => {
                  if (rotatePasskey) {
                    await handleRegisterPasskey()
                  }

                  setIsEditOpen(false)
                })()
              }}
            >
              {isRegisteringPasskey ? <Spinner data-icon="inline-start" /> : null}
              {isRegisteringPasskey ? securityCopy.editDialog.saving : securityCopy.editDialog.save}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field>
            <FieldLabel>{securityCopy.editDialog.rotatePasskeyLabel}</FieldLabel>
            <div className="flex items-start gap-2 rounded-md border border-border/60 p-3">
              <Checkbox
                checked={rotatePasskey}
                onCheckedChange={(checked) => setRotatePasskey(checked === true)}
                disabled={isRegisteringPasskey}
              />
              <p className="text-sm text-muted-foreground">{securityCopy.editDialog.rotatePasskeyDescription}</p>
            </div>
          </Field>

          <Separator />

          <div className="grid gap-2 sm:grid-cols-2">
            <Row label={securityCopy.session.browser} value={security.session.browser} />
            <Row label={securityCopy.session.operatingSystem} value={security.session.operatingSystem} />
            <Row label={securityCopy.session.ip} value={security.session.ipAddress ?? securityCopy.session.unavailable} />
            <Row label={securityCopy.session.authenticatedAt} value={security.session.authenticatedAt ? formatDateTime(security.session.authenticatedAt) : securityCopy.session.unavailable} />
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={Boolean(registeredPasskey)}
        onOpenChange={(open) => {
          if (!open) {
            setRegisteredPasskey(null)
          }
        }}
        title={securityCopy.passkey.dialogTitle}
        description={securityCopy.passkey.dialogDescription}
        footer={<Button type="button" size="lg" onClick={() => setRegisteredPasskey(null)}>{securityCopy.passkey.dialogClose}</Button>}
      >
        <div className="grid gap-3">
          <Row label={securityCopy.passkey.name} value={registeredPasskey?.friendlyName || "Passkey do dispositivo"} />
          <Row label={securityCopy.passkey.createdAt} value={formatDateTime(registeredPasskey?.createdAt)} />
        </div>
      </AppDialog>
    </>
  )
}
