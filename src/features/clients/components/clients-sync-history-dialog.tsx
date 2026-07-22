import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  HistoryIcon,
  RefreshCcwIcon,
  XCircleIcon,
} from "lucide-react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppSheet } from "@/components/shared/app-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { clientsCopy } from "../constants/clients-copy"
import {
  formatClientDateTime,
  formatDurationSeconds,
  type ClientSyncCounters,
  type ClientSyncHistoryEntry,
  type ClientSyncStatus,
} from "../model"

interface ClientsSyncHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: readonly ClientSyncHistoryEntry[]
  isLoading: boolean
  error?: Error | string | null
  onRetry?: () => void
  onSync?: () => void
  isSyncing?: boolean
}

interface SyncHistoryCounter {
  label: string
  value: number
}

interface SyncDetailRow {
  label: string
  value: string
}

const statusBadgeClassNameByType: Record<ClientSyncStatus, string> = {
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
}

function resolveErrorMessage(error: Error | string | null | undefined) {
  if (!error) {
    return null
  }

  return error instanceof Error ? error.message : error
}

function getClientSyncCounters(counters: ClientSyncCounters): readonly SyncHistoryCounter[] {
  return [
    { label: clientsCopy.sync.history.counters.clientsReceived, value: counters.clientsReceived },
    { label: clientsCopy.sync.history.counters.clientsCreated, value: counters.clientsCreated },
    { label: clientsCopy.sync.history.counters.clientsUpdated, value: counters.clientsUpdated },
    { label: clientsCopy.sync.history.counters.clientsUnchanged, value: counters.clientsUnchanged },
    { label: clientsCopy.sync.history.counters.clientsRejected, value: counters.clientsRejected },
    { label: clientsCopy.sync.history.counters.clientsFailed, value: counters.clientsFailed },
    { label: clientsCopy.sync.history.counters.vehiclesReceived, value: counters.vehiclesReceived },
    { label: clientsCopy.sync.history.counters.vehiclesCreated, value: counters.vehiclesCreated },
    { label: clientsCopy.sync.history.counters.vehiclesUpdated, value: counters.vehiclesUpdated },
    { label: clientsCopy.sync.history.counters.vehiclesUnchanged, value: counters.vehiclesUnchanged },
    { label: clientsCopy.sync.history.counters.vehiclesRejected, value: counters.vehiclesRejected },
    { label: clientsCopy.sync.history.counters.vehiclesFailed, value: counters.vehiclesFailed },
  ]
}

function getSyncRunStatusLabel(status: ClientSyncStatus) {
  return clientsCopy.sync.history.statuses[status]
}

function getSyncRunModeLabel(mode: ClientSyncHistoryEntry["mode"]) {
  return clientsCopy.sync.history.modes[mode]
}

function getSyncRunTriggerLabel(trigger: ClientSyncHistoryEntry["trigger"]) {
  return clientsCopy.sync.history.triggers[trigger]
}

function renderStatusIcon(status: ClientSyncStatus) {
  if (status === "success") {
    return <CheckCircle2Icon className="size-3" aria-hidden="true" />
  }

  if (status === "warning") {
    return <AlertTriangleIcon className="size-3" aria-hidden="true" />
  }

  return <XCircleIcon className="size-3" aria-hidden="true" />
}

function buildDetailRows(entry: ClientSyncHistoryEntry): SyncDetailRow[] {
  return [
    {
      label: clientsCopy.sync.history.details.duration,
      value: formatDurationSeconds(entry.durationSeconds, clientsCopy.shared.notFinished),
    },
    ...getClientSyncCounters(entry.counters).map((counter) => ({
      label: counter.label,
      value: String(counter.value),
    })),
    {
      label: clientsCopy.sync.history.details.start,
      value: formatClientDateTime(entry.startedAt, clientsCopy.shared.emptyValue),
    },
    {
      label: clientsCopy.sync.history.details.end,
      value: formatClientDateTime(entry.finishedAt, clientsCopy.shared.notFinished),
    },
    {
      label: clientsCopy.sync.history.details.mode,
      value: getSyncRunModeLabel(entry.mode),
    },
    {
      label: clientsCopy.sync.history.details.trigger,
      value: getSyncRunTriggerLabel(entry.trigger),
    },
  ]
}

function ClientSyncHistorySkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-28 bg-muted/60" />
            <Skeleton className="h-5 w-20 rounded-full bg-muted/60" />
          </div>
          <div className="mt-2.5 flex gap-2">
            <Skeleton className="h-4 w-16 rounded-full bg-muted/60" />
            <Skeleton className="h-4 w-16 rounded-full bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ClientsSyncHistoryDialog({
  open,
  onOpenChange,
  entries,
  isLoading,
  error = null,
  onRetry,
  onSync,
  isSyncing = false,
}: ClientsSyncHistoryDialogProps) {
  const errorMessage = resolveErrorMessage(error)

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={clientsCopy.sync.history.title}
      description={clientsCopy.sync.history.description}
      side="right"
      className="gap-0 sm:max-w-md"
    >
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? <ClientSyncHistorySkeleton /> : null}

        {!isLoading && errorMessage ? (
          <AppEmptyState
            media={<AlertTriangleIcon />}
            title={clientsCopy.sync.history.loadErrorTitle}
            description={errorMessage}
            actions={onRetry ? (
              <Button type="button" variant="secondary" size="lg" onClick={onRetry}>
                <RefreshCcwIcon aria-hidden="true" />
                {clientsCopy.sync.retryLabel}
              </Button>
            ) : null}
          />
        ) : null}

        {!isLoading && !errorMessage && entries.length === 0 ? (
          <AppEmptyState
            media={<HistoryIcon />}
            title={clientsCopy.sync.history.emptyTitle}
            description={clientsCopy.sync.history.emptyDescription}
            actions={onSync ? (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isSyncing}
                onClick={onSync}
              >
                <RefreshCcwIcon aria-hidden="true" />
                {clientsCopy.actions.sync}
              </Button>
            ) : null}
          />
        ) : null}

        {!isLoading && !errorMessage && entries.length > 0 ? (
          <ol className="relative ml-2 space-y-3 border-l-2 border-border/60 pl-4">
            {entries.map((entry) => {
              const details = buildDetailRows(entry)

              return (
                <li key={entry.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-[-1.4rem] top-3 size-2.5 rounded-full ring-2 ring-background",
                      entry.status === "success"
                        ? "bg-success"
                        : entry.status === "warning"
                          ? "bg-warning"
                          : "bg-destructive"
                    )}
                  />
                  <Collapsible defaultOpen={false} className="group/client-sync-history-item">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-xs font-medium text-foreground">
                              {formatClientDateTime(entry.startedAt, clientsCopy.shared.emptyValue)}
                            </p>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "inline-flex shrink-0 items-center gap-1 text-[0.625rem]",
                                statusBadgeClassNameByType[entry.status]
                              )}
                            >
                              {renderStatusIcon(entry.status)}
                              {getSyncRunStatusLabel(entry.status)}
                            </Badge>
                          </div>

                          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/client-sync-history-item:rotate-180" />
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-2 overflow-hidden rounded-md bg-background/60 p-2.5">
                        <dl className="grid gap-y-1.5 text-xs">
                          {details.map((detail) => (
                            <div
                              key={`${entry.id}-${detail.label}-${detail.value}`}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4"
                            >
                              <dt className="min-w-0 truncate text-muted-foreground">
                                {detail.label}
                              </dt>
                              <dd className="shrink-0 text-right font-medium tabular-nums text-foreground">
                                {detail.value}
                              </dd>
                            </div>
                          ))}
                        </dl>

                        {entry.message ? (
                          <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                            {entry.message}
                          </p>
                        ) : null}

                        {entry.errorDetails.length > 0 ? (
                          <div className="mt-2 flex items-start gap-2 rounded-md bg-destructive/5 p-2 text-xs text-destructive">
                            <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                            <div className="space-y-0.5">
                              {entry.errorDetails.map((detail) => (
                                <p key={`${entry.id}-${detail}`}>{detail}</p>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </li>
              )
            })}
          </ol>
        ) : null}
      </div>
    </AppSheet>
  )
}
