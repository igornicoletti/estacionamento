import { MonitorSmartphoneIcon } from "lucide-react"

import { AppDialog } from "@/components/shared/app-dialog"
import { AppStatusBadge } from "@/components/shared/app-status-badge"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { formatDateTime } from "@/lib/formatters"

import { securityCopy } from "../constants/security-copy"
import { type SecuritySessionRecord } from "../types/security-types"

export function SecurityLoginsDialog({
  isSaving,
  onOpenChange,
  onReview,
  open,
  sessions,
}: {
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onReview: () => void | Promise<void>
  open: boolean
  sessions: readonly SecuritySessionRecord[]
}) {
  const sortedSessions = [...sessions].sort((left, right) => {
    const rightTimestamp = Date.parse(right.lastSeenAt)
    const leftTimestamp = Date.parse(left.lastSeenAt)

    return (
      (Number.isNaN(rightTimestamp) ? 0 : rightTimestamp) -
      (Number.isNaN(leftTimestamp) ? 0 : leftTimestamp)
    )
  })

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSaving) onOpenChange(nextOpen)
      }}
      title={securityCopy.loginsDialog.title}
      description={securityCopy.loginsDialog.description}
      footer={(
        <div className="grid w-full grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            {securityCopy.loginsDialog.cancel}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={isSaving || sessions.length === 0}
            onClick={() => void onReview()}
          >
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {securityCopy.loginsDialog.confirm}
          </Button>
        </div>
      )}
    >
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {securityCopy.loginsDialog.empty}
        </p>
      ) : (
        <ItemGroup className="gap-2">
          {sortedSessions.map((session) => (
            <Item
              key={`${session.createdAt}-${session.ipAddress ?? "unknown"}`}
              variant="muted"
              size="sm"
            >
              <ItemMedia variant="icon">
                <MonitorSmartphoneIcon aria-hidden="true" />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>
                  {session.browser} · {session.operatingSystem}
                </ItemTitle>
                <ItemDescription>
                  {session.ipAddress ?? securityCopy.loginsDialog.unknownIp}
                  {` · ${formatDateTime(session.lastSeenAt)}`}
                </ItemDescription>
              </ItemContent>
              <ItemActions className="flex-wrap justify-end">
                {session.current ? (
                  <AppStatusBadge tone="info">
                    {securityCopy.loginsDialog.current}
                  </AppStatusBadge>
                ) : null}
                {session.trusted ? (
                  <AppStatusBadge tone="success">
                    {securityCopy.loginsDialog.trusted}
                  </AppStatusBadge>
                ) : null}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </AppDialog>
  )
}
