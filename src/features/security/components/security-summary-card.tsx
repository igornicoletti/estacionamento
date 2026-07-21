import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppDialog } from "@/components/shared/app-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { cn, formatDateTime, getBadgeToneClassName } from "@/lib"

import { securityCopy } from "../constants/security-copy"
import {
  createSecurityScore,
  getSecurityMeasureStatuses,
  getSecurityScoreTone,
} from "../model"
import type {
  SecurityEventSummary,
  SecurityMeasureId,
  SecurityMeasureStatus,
  SecurityScore,
  SecuritySnapshot,
  SecuritySummary,
} from "../types/security-types"

interface SecuritySummaryCardProps {
  events: readonly SecurityEventSummary[]
  eventsError?: Error | null
  isEventsLoading?: boolean
  isRegisteringPasskey?: boolean
  onOpenChangePassword: () => void
  onRegisterPasskey: SecuritySnapshot["registerPasskey"]
  security: SecuritySummary
}

interface SecurityMeasureRowProps {
  action?: ReactNode
  description: string
  icon: ReactNode
  status: SecurityMeasureStatus
  title: string
}

function SecurityScoreRing({ score }: { score: SecurityScore }) {
  const tone = getSecurityScoreTone(score)
  const circumference = 2 * Math.PI * 42
  const dashOffset = circumference - (score.value / 100) * circumference
  const ringClassName = {
    destructive: "text-destructive",
    info: "text-primary",
    success: "text-success",
    warning: "text-warning",
  }[tone]

  return (
    <div className="relative size-24 shrink-0" aria-label={`${score.value} de 100`}>
      <svg className="-rotate-90 text-muted" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
        />
        <circle
          className={cn("transition-all duration-300", ringClassName)}
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-foreground">{score.value}</span>
        <span className="text-[0.6875rem] text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

function SecurityStatusBadge({ status }: { status: SecurityMeasureStatus }) {
  const isCompleted = status === "completed"

  return (
    <Badge
      variant="secondary"
      className={getBadgeToneClassName(isCompleted ? "success" : "warning")}
    >
      {isCompleted ? securityCopy.status.completed : securityCopy.status.actionRequired}
    </Badge>
  )
}

function SecurityMeasureRow({
  action,
  description,
  icon,
  status,
  title,
}: SecurityMeasureRowProps) {
  const isCompleted = status === "completed"

  return (
    <Item variant="default" className="items-start px-0 py-0">
      <ItemMedia variant="icon" className={cn("mt-0.5", isCompleted ? "text-success" : "text-warning")}>
        {isCompleted ? <CheckCircle2Icon aria-hidden="true" /> : <AlertTriangleIcon aria-hidden="true" />}
      </ItemMedia>
      <ItemMedia variant="icon" className="mt-0.5 text-muted-foreground">
        {icon}
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-none">{title}</ItemTitle>
        <ItemDescription className="line-clamp-none">{description}</ItemDescription>
      </ItemContent>
      <ItemActions className="ml-auto flex-wrap justify-end">
        {action ?? <SecurityStatusBadge status={status} />}
      </ItemActions>
    </Item>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function EventSkeletons() {
  return (
    <div className="grid gap-3" aria-label={securityCopy.events.loading}>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function SecurityEventsList({
  events,
  eventsError,
  isEventsLoading,
}: {
  events: readonly SecurityEventSummary[]
  eventsError?: Error | null
  isEventsLoading?: boolean
}) {
  if (isEventsLoading) {
    return <EventSkeletons />
  }

  if (eventsError) {
    return (
      <p className="text-sm text-muted-foreground">{securityCopy.events.error}</p>
    )
  }

  if (events.length === 0) {
    return (
      <div className="grid gap-1 text-sm">
        <p className="font-medium text-foreground">{securityCopy.events.emptyTitle}</p>
        <p className="text-muted-foreground">{securityCopy.events.emptyDescription}</p>
      </div>
    )
  }

  return (
    <ItemGroup className="gap-3">
      {events.map((event, index) => (
        <React.Fragment key={event.id}>
          <Item variant="default" className="items-start px-0 py-0">
            <ItemMedia variant="icon" className="mt-1 text-primary">
              <BellIcon aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="line-clamp-none">{event.title}</ItemTitle>
              <ItemDescription className="line-clamp-none">{event.description}</ItemDescription>
            </ItemContent>
            <ItemActions className="ml-auto text-xs text-muted-foreground">
              {formatDateTime(event.occurredAt)}
            </ItemActions>
          </Item>
          {index < events.length - 1 ? <ItemSeparator className="my-0" /> : null}
        </React.Fragment>
      ))}
    </ItemGroup>
  )
}

function resolveMeasureStatus(
  statuses: Record<SecurityMeasureId, SecurityMeasureStatus>,
  id: SecurityMeasureId
) {
  return statuses[id]
}

export function SecuritySummaryCard({
  events,
  eventsError = null,
  isEventsLoading = false,
  isRegisteringPasskey = false,
  onOpenChangePassword,
  onRegisterPasskey,
  security,
}: SecuritySummaryCardProps) {
  const statuses = getSecurityMeasureStatuses(security)
  const score = createSecurityScore(statuses)
  const scoreTone = getSecurityScoreTone(score)
  const hasPasskey = security.passkeyStatus === "active"
  const hasWildcardPermission = security.permissions.includes("*")
  const [registeredPasskey, setRegisteredPasskey] = React.useState<Awaited<ReturnType<SecuritySnapshot["registerPasskey"]>> | null>(null)

  async function handleRegisterPasskey() {
    const passkey = await onRegisterPasskey()
    setRegisteredPasskey(passkey)
  }

  return (
    <>
      <div className="grid gap-4">
        <Card>
          <CardContent className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
            <SecurityScoreRing score={score} />
            <div className="grid gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{securityCopy.score.title}</h2>
                <Badge variant="secondary" className={getBadgeToneClassName(scoreTone)}>
                  {securityCopy.score.labels[scoreTone]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{securityCopy.score.completed(score)}</p>
              <p className="text-sm text-foreground">{securityCopy.score.remaining(score)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{securityCopy.page.title}</CardTitle>
            <CardDescription>{securityCopy.page.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-5">
              <SecurityMeasureRow
                title={securityCopy.measures.strongPassword.title}
                description={securityCopy.measures.strongPassword.description}
                icon={<LockKeyholeIcon aria-hidden="true" />}
                status={resolveMeasureStatus(statuses, "strong-password")}
                action={(
                  <>
                    <SecurityStatusBadge status={resolveMeasureStatus(statuses, "strong-password")} />
                    <Button type="button" variant="secondary" size="sm" onClick={onOpenChangePassword}>
                      <LockKeyholeIcon aria-hidden="true" />
                      {securityCopy.measures.strongPassword.action}
                    </Button>
                  </>
                )}
              />

              <ItemSeparator className="my-0" />

              <SecurityMeasureRow
                title={securityCopy.measures.passkey.title}
                description={hasPasskey ? securityCopy.measures.passkey.activeDescription : securityCopy.measures.passkey.inactiveDescription}
                icon={<KeyRoundIcon aria-hidden="true" />}
                status={resolveMeasureStatus(statuses, "passkey")}
                action={(
                  <>
                    {hasPasskey ? <SecurityStatusBadge status={resolveMeasureStatus(statuses, "passkey")} /> : null}
                    <Button
                      type="button"
                      variant={hasPasskey ? "secondary" : "default"}
                      size="sm"
                      disabled={isRegisteringPasskey}
                      onClick={() => { void handleRegisterPasskey() }}
                    >
                      {isRegisteringPasskey ? <Spinner data-icon="inline-start" /> : <KeyRoundIcon aria-hidden="true" />}
                      {isRegisteringPasskey
                        ? securityCopy.measures.passkey.activating
                        : hasPasskey
                          ? securityCopy.measures.passkey.rotateAction
                          : securityCopy.measures.passkey.addAction}
                    </Button>
                  </>
                )}
              />

              <ItemSeparator className="my-0" />

              <SecurityMeasureRow
                title={securityCopy.measures.recoveryContact.title}
                description={resolveMeasureStatus(statuses, "recovery-contact") === "completed"
                  ? securityCopy.measures.recoveryContact.configuredDescription
                  : securityCopy.measures.recoveryContact.missingDescription}
                icon={<SmartphoneIcon aria-hidden="true" />}
                status={resolveMeasureStatus(statuses, "recovery-contact")}
                action={resolveMeasureStatus(statuses, "recovery-contact") === "completed" ? undefined : (
                  <>
                    <SecurityStatusBadge status={resolveMeasureStatus(statuses, "recovery-contact")} />
                    <Button asChild variant="secondary" size="sm">
                      <Link to={appRoutePaths.profile}>
                        {securityCopy.measures.recoveryContact.updateAction}
                        <ChevronRightIcon aria-hidden="true" />
                      </Link>
                    </Button>
                  </>
                )}
              />
            </ItemGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <CardTitle>{securityCopy.events.title}</CardTitle>
              <CardDescription>{securityCopy.events.description}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="justify-self-end">
              <Link to={appRoutePaths.notifications}>
                {securityCopy.events.viewAll}
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <SecurityEventsList
              events={events}
              eventsError={eventsError}
              isEventsLoading={isEventsLoading}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{securityCopy.session.title}</CardTitle>
              <CardDescription>{securityCopy.session.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailRow label={securityCopy.session.browser} value={security.session.browser} />
              <DetailRow label={securityCopy.session.operatingSystem} value={security.session.operatingSystem} />
              <DetailRow label={securityCopy.session.ip} value={security.session.ipAddress ?? securityCopy.session.unavailable} />
              <DetailRow label={securityCopy.session.authenticatedAt} value={security.session.authenticatedAt ? formatDateTime(security.session.authenticatedAt) : securityCopy.session.unavailable} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{securityCopy.permissions.title}</CardTitle>
              <CardDescription>{securityCopy.permissions.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {hasWildcardPermission ? (
                <Badge variant="secondary" className={cn("w-fit", getBadgeToneClassName("success"))}>
                  <ShieldCheckIcon aria-hidden="true" />
                  {securityCopy.permissions.wildcard}
                </Badge>
              ) : security.permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{securityCopy.permissions.none}</p>
              ) : (
                <>
                  <Badge variant="secondary" className="w-fit">{securityCopy.permissions.count(security.permissions.length)}</Badge>
                  <Separator />
                  <div className="flex flex-wrap gap-1.5">
                    {security.permissions.map((permission) => (
                      <code key={permission} className="rounded-md border border-border/60 bg-muted px-2 py-1 text-xs text-foreground">
                        {permission}
                      </code>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AppDialog
        open={Boolean(registeredPasskey)}
        onOpenChange={(open) => {
          if (!open) {
            setRegisteredPasskey(null)
          }
        }}
        title={securityCopy.measures.passkey.dialogTitle}
        description={securityCopy.measures.passkey.dialogDescription}
        footer={<Button type="button" size="lg" onClick={() => setRegisteredPasskey(null)}>{securityCopy.measures.passkey.dialogClose}</Button>}
      >
        <div className="grid gap-3">
          <DetailRow label={securityCopy.measures.passkey.name} value={registeredPasskey?.friendlyName || "Passkey do dispositivo"} />
          <DetailRow label={securityCopy.measures.passkey.createdAt} value={formatDateTime(registeredPasskey?.createdAt)} />
        </div>
      </AppDialog>
    </>
  )
}
