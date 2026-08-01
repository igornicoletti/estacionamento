import {
  AlertCircleIcon,
  Building2Icon,
  CheckCircle2Icon,
  UsersRoundIcon,
} from "lucide-react"

import { AppDialog } from "@/components/shared/app-dialog"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppStatusBadge } from "@/components/shared/app-status-badge"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { formatDateTime } from "@/lib"

import { syncCopy } from "../constants/sync-copy"
import { useSyncController } from "../hooks/use-sync-controller"
import { useSyncHistory } from "../hooks/use-sync-history"
import {
  type SyncExecutionSummary,
  type SyncResource,
  type SyncRun,
  type SyncStatus,
} from "../model/sync-types"

interface SyncDialogProps {
  open: boolean
  resource: SyncResource
  onOpenChange: (open: boolean) => void
  onSynchronized?: () => void | Promise<void>
}

function formatCountdown(seconds: number | null) {
  if (seconds === null) return "Calculando..."
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0")
  const remainder = (seconds % 60).toString().padStart(2, "0")
  return `${minutes}:${remainder}`
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return syncCopy.labels.unavailable
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return minutes > 0 ? `${minutes} min ${remaining} s` : `${remaining} s`
}

function resolveStatusTone(status: SyncStatus) {
  if (status === "success") return "success" as const
  if (status === "warning") return "warning" as const
  return "error" as const
}

function LatestSyncDetails({
  error,
  isLoading,
  run,
}: {
  error: Error | null
  isLoading: boolean
  run: SyncRun | null
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-label={syncCopy.dialog.loadingLastRun}>
        <Skeleton className="h-4 w-36" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        {syncCopy.dialog.lastRunUnavailable}
      </p>
    )
  }

  if (!run) {
    return (
      <p className="text-sm text-muted-foreground">
        {syncCopy.dialog.noPreviousRun}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{syncCopy.dialog.lastRunTitle}</p>
      <ItemGroup className="grid grid-cols-2 gap-2">
        <Item variant="muted" size="xs">
          <ItemContent>
            <ItemTitle>{syncCopy.labels.status}</ItemTitle>
            <div>
              <AppStatusBadge tone={resolveStatusTone(run.status)}>
                {syncCopy.status[run.status]}
              </AppStatusBadge>
            </div>
          </ItemContent>
        </Item>
        <Item variant="muted" size="xs">
          <ItemContent>
            <ItemTitle>{syncCopy.labels.completedAt}</ItemTitle>
            <ItemDescription>
              {formatDateTime(run.finishedAt ?? run.startedAt)}
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="muted" size="xs">
          <ItemContent>
            <ItemTitle>{syncCopy.labels.duration}</ItemTitle>
            <ItemDescription className="tabular-nums">
              {formatDuration(run.durationSeconds)}
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="muted" size="xs">
          <ItemContent>
            <ItemTitle>{syncCopy.labels.mode}</ItemTitle>
            <ItemDescription>{syncCopy.labels[run.mode]}</ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="muted" size="xs" className="col-span-2">
          <ItemContent>
            <ItemTitle>{syncCopy.labels.trigger}</ItemTitle>
            <ItemDescription>{syncCopy.labels[run.trigger]}</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  )
}

function Summary({ summary }: { summary: SyncExecutionSummary }) {
  const items = [
    [syncCopy.labels.received, summary.received],
    [syncCopy.labels.created, summary.created],
    [syncCopy.labels.updated, summary.updated],
    [syncCopy.labels.unchanged, summary.unchanged],
    [syncCopy.labels.rejected, summary.rejected],
    [syncCopy.labels.failed, summary.failed],
  ] as const

  return (
    <ItemGroup className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <Item key={label} variant="muted">
          <ItemContent>
            <ItemTitle>{label}</ItemTitle>
            <span className="tabular-nums">{value}</span>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

export function SyncDialog({
  open,
  resource,
  onOpenChange,
  onSynchronized,
}: SyncDialogProps) {
  const controller = useSyncController(resource, onSynchronized)
  const history = useSyncHistory(
    resource,
    open && controller.phase === "idle"
  )
  const ResourceIcon = resource === "units" ? Building2Icon : UsersRoundIcon

  function close() {
    if (controller.isBlocking) return
    controller.reset()
    onOpenChange(false)
  }

  const footer = controller.phase === "idle" ? (
    <>
      <Button type="button" variant="outline" onClick={close}>
        {syncCopy.actions.cancel}
      </Button>
      <Button type="button" onClick={() => void controller.start()}>
        {syncCopy.actions.synchronize}
      </Button>
    </>
  ) : controller.phase === "success" ? (
    <Button type="button" onClick={close}>{syncCopy.actions.close}</Button>
  ) : controller.phase === "error" ? (
    <>
      <Button type="button" variant="outline" onClick={close}>
        {syncCopy.actions.cancel}
      </Button>
      <Button type="button" onClick={() => void controller.start()}>
        {syncCopy.actions.retry}
      </Button>
    </>
  ) : null

  return (
    <AppDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close()
      }}
      title={syncCopy.dialog.title(resource)}
      description={syncCopy.dialog.description(resource)}
      footer={footer}
      contentProps={{
        showCloseButton: false,
        onEscapeKeyDown: (event) => {
          if (controller.isBlocking) event.preventDefault()
        },
        onInteractOutside: (event) => {
          if (controller.isBlocking) event.preventDefault()
        },
      }}
    >
      {controller.phase === "idle" ? (
        <div className="flex flex-col gap-4">
          <AppEmptyState
            media={(
              <ResourceIcon
                data-sync-resource-icon={resource}
                aria-hidden="true"
              />
            )}
            title={syncCopy.dialog.confirmTitle}
            description={syncCopy.dialog.confirmDescription}
          />
          <LatestSyncDetails
            error={history.error}
            isLoading={history.isLoading}
            run={history.data?.runs[0] ?? null}
          />
        </div>
      ) : null}
      {controller.phase === "running" ? (
        <AppEmptyState
          media={<Spinner aria-hidden="true" />}
          title={syncCopy.dialog.runningTitle}
          description={(
            <span className="flex flex-col gap-1">
              <span>{syncCopy.dialog.runningDescription}</span>
              <span className="tabular-nums">
                {syncCopy.labels.remaining}: {formatCountdown(controller.remainingSeconds)}
              </span>
              <span>
                Etapa {Math.min(
                  controller.progress.completedSteps + 1,
                  controller.progress.totalSteps
                )} de {controller.progress.totalSteps}
              </span>
            </span>
          )}
        />
      ) : null}
      {controller.phase === "success" && controller.summary ? (
        <div className="flex flex-col gap-4">
          <AppEmptyState
            media={<CheckCircle2Icon aria-hidden="true" />}
            title={syncCopy.dialog.successTitle}
            description={controller.summary.message}
          />
          <Summary summary={controller.summary} />
        </div>
      ) : null}
      {controller.phase === "error" ? (
        <AppEmptyState
          media={<AlertCircleIcon aria-hidden="true" />}
          title={syncCopy.dialog.errorTitle}
          description={controller.error?.message}
        />
      ) : null}
    </AppDialog>
  )
}
