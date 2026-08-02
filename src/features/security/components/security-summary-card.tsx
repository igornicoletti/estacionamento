import {
  ChevronRightIcon,
  FingerprintIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppStatusBadge } from "@/components/shared/app-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ItemGroup } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

import { securityCopy } from "../constants/security-copy"
import {
  createSecurityScore,
  getSecurityMeasureStatuses,
  getSecurityScoreTone,
} from "../model/security-models"
import {
  type SecurityEventSummary,
  type SecurityMeasureId,
  type SecuritySummary,
} from "../types/security-types"
import { SecurityEventsList } from "./security-events-list"
import { SecurityMeasureRow } from "./security-measure-row"
import { SecurityScoreChart } from "./security-score-chart"

interface SecuritySummaryCardProps {
  events: readonly SecurityEventSummary[]
  eventsError?: Error | null
  isEventsLoading?: boolean
  isConfiguringMfa: boolean
  isRegisteringPasskey: boolean
  isTrustingDevice: boolean
  onOpenChangePassword: () => void
  onOpenLogins: () => void
  onOpenMfa: () => void
  onRegisterPasskey: () => void | Promise<void>
  onTrustDevice: () => void | Promise<void>
  security: SecuritySummary
}

function ActionButton({
  ariaLabel,
  isPending = false,
  label,
  onClick,
}: {
  ariaLabel?: string
  isPending?: boolean
  label: string
  onClick: () => void | Promise<void>
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      aria-label={ariaLabel}
      disabled={isPending}
      onClick={() => void onClick()}
    >
      {isPending ? <Spinner data-icon="inline-start" /> : null}
      {label}
      {!isPending ? (
        <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
      ) : null}
    </Button>
  )
}

export function SecuritySummaryCard({
  events,
  eventsError = null,
  isEventsLoading = false,
  isConfiguringMfa,
  isRegisteringPasskey,
  isTrustingDevice,
  onOpenChangePassword,
  onOpenLogins,
  onOpenMfa,
  onRegisterPasskey,
  onTrustDevice,
  security,
}: SecuritySummaryCardProps) {
  const statuses = getSecurityMeasureStatuses(security)
  const score = createSecurityScore(statuses)
  const scoreTone = getSecurityScoreTone(score)
  const status = (id: SecurityMeasureId) => statuses[id]

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <section className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <div className="justify-self-center sm:justify-self-start">
            <SecurityScoreChart score={score} />
          </div>
          <div className="flex min-w-0 flex-col gap-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-base font-semibold">
                {securityCopy.score.title}
              </h2>
              <AppStatusBadge tone={scoreTone}>
                {securityCopy.score.labels[scoreTone]}
              </AppStatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              {securityCopy.score.completed(score)}
            </p>
            <p className="text-sm">{securityCopy.score.remaining(score)}</p>
          </div>
        </section>

        <Separator />

        <ItemGroup className="gap-5!" data-security-list="measures">
          <SecurityMeasureRow
            title={securityCopy.measures.twoFactorAuthentication.title}
            description={securityCopy.measures.twoFactorAuthentication.description}
            guidance={securityCopy.measures.twoFactorAuthentication.guidance}
            icon={SmartphoneIcon}
            status={status("two-factor-authentication")}
            action={
              status("two-factor-authentication") === "action-required" ? (
                <ActionButton
                  ariaLabel={securityCopy.measures.twoFactorAuthentication.actionLabel}
                  isPending={isConfiguringMfa}
                  label={securityCopy.measures.twoFactorAuthentication.action}
                  onClick={onOpenMfa}
                />
              ) : undefined
            }
          />

          <SecurityMeasureRow
            title={securityCopy.measures.strongPassword.title}
            description={securityCopy.measures.strongPassword.description}
            guidance={securityCopy.measures.strongPassword.guidance}
            icon={LockKeyholeIcon}
            status={status("strong-password")}
            action={(
              <ActionButton
                ariaLabel={securityCopy.measures.strongPassword.actionLabel}
                label={securityCopy.measures.strongPassword.action}
                onClick={onOpenChangePassword}
              />
            )}
          />

          <SecurityMeasureRow
            title={securityCopy.measures.passkey.title}
            description={securityCopy.measures.passkey.activeDescription}
            guidance={securityCopy.measures.passkey.guidance}
            icon={FingerprintIcon}
            status={status("passkey")}
            action={(
              <ActionButton
                ariaLabel={securityCopy.measures.passkey.actionLabel}
                isPending={isRegisteringPasskey}
                label={securityCopy.measures.passkey.addAction}
                onClick={onRegisterPasskey}
              />
            )}
          />

          <SecurityMeasureRow
            title={securityCopy.measures.recoveryOptions.title}
            description={securityCopy.measures.recoveryOptions.description}
            guidance={securityCopy.measures.recoveryOptions.guidance}
            icon={KeyRoundIcon}
            status={status("recovery-options")}
            action={
              status("recovery-options") === "action-required" ? (
                <Button asChild variant="ghost" size="xs">
                  <Link
                    to={appRoutePaths.profile}
                    aria-label={securityCopy.measures.recoveryOptions.actionLabel}
                  >
                    {securityCopy.measures.recoveryOptions.action}
                    <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              ) : undefined
            }
          />

          <SecurityMeasureRow
            title={securityCopy.measures.recentLogins.title}
            description={securityCopy.measures.recentLogins.description}
            guidance={securityCopy.measures.recentLogins.guidance}
            icon={MonitorSmartphoneIcon}
            status={status("recent-logins")}
            action={(
              <ActionButton
                ariaLabel={securityCopy.measures.recentLogins.actionLabel}
                label={securityCopy.measures.recentLogins.action}
                onClick={onOpenLogins}
              />
            )}
          />

          <SecurityMeasureRow
            title={securityCopy.measures.trustedDevices.title}
            description={securityCopy.measures.trustedDevices.description}
            guidance={securityCopy.measures.trustedDevices.guidance}
            icon={ShieldCheckIcon}
            status={status("trusted-devices")}
            action={
              status("trusted-devices") === "action-required" ? (
                <ActionButton
                  ariaLabel={securityCopy.measures.trustedDevices.actionLabel}
                  isPending={isTrustingDevice}
                  label={isTrustingDevice
                    ? securityCopy.measures.trustedDevices.saving
                    : securityCopy.measures.trustedDevices.action}
                  onClick={onTrustDevice}
                />
              ) : undefined
            }
          />
        </ItemGroup>

        <Separator />

        <SecurityEventsList
          events={events}
          error={eventsError}
          isLoading={isEventsLoading}
        />
      </CardContent>
    </Card>
  )
}
