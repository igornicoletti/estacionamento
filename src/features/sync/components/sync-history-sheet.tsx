import {
  AlertCircleIcon,
  ChevronDownIcon,
  DatabaseIcon,
} from "lucide-react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppSheet } from "@/components/shared/app-sheet"
import { AppStatusBadge } from "@/components/shared/app-status-badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/formatters"

import { syncCopy } from "../constants/sync-copy"
import { useSyncHistory } from "../hooks/use-sync-history"
import { type SyncRun, type SyncStatus, type SyncResource } from "../model/sync-types"

interface SyncHistorySheetProps {
  open: boolean
  resource: SyncResource
  onOpenChange: (open: boolean) => void
}

function resolveStatusTone(status: SyncStatus) {
  if (status === "success") return "success" as const
  if (status === "warning") return "warning" as const
  return "error" as const
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—"
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return minutes > 0 ? `${minutes} min ${remaining} s` : `${remaining} s`
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RunDetails({ run }: { run: SyncRun }) {
  const values = [
    [syncCopy.labels.received, run.received],
    [syncCopy.labels.created, run.created],
    [syncCopy.labels.updated, run.updated],
    [syncCopy.labels.unchanged, run.unchanged],
    [syncCopy.labels.rejected, run.rejected],
    [syncCopy.labels.failed, run.failed],
  ] as const

  return (
    <dl className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3">
      {values.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function HistoryTimeline({ runs }: { runs: SyncRun[] }) {
  return (
    <div className="relative flex flex-col gap-2 px-4 before:absolute before:top-4 before:bottom-4 before:left-[1.4rem] before:w-px before:bg-border sm:px-6 sm:before:left-[1.9rem]">
      {runs.map((run) => (
        <div key={run.id} className="relative pl-8">
          <span className="absolute top-4 left-0 size-3 rounded-full border-2 border-background bg-primary" />
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-between px-0 py-2 text-left"
              >
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="font-medium">{formatDateTime(run.startedAt)}</span>
                  <span className="text-sm text-muted-foreground">
                    {run.scope === "vehicles"
                      ? syncCopy.labels.vehicles
                      : run.scope === "clients"
                        ? syncCopy.labels.clients
                        : syncCopy.labels.units}
                    {` · ${formatDuration(run.durationSeconds)}`}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <AppStatusBadge tone={resolveStatusTone(run.status)}>
                    {syncCopy.status[run.status]}
                  </AppStatusBadge>
                  <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm text-muted-foreground">{run.message}</p>
              <RunDetails run={run} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  )
}

export function SyncHistorySheet({
  open,
  resource,
  onOpenChange,
}: SyncHistorySheetProps) {
  const { data, error, isLoading, refetch } = useSyncHistory(resource, open)

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={syncCopy.history.title}
      description={syncCopy.history.description(resource)}
      className="sm:max-w-xl"
    >
      <div className="no-scrollbar overflow-y-auto pb-6">
        {isLoading ? <HistorySkeleton /> : null}
        {!isLoading && error ? (
          <AppEmptyState
            media={<AlertCircleIcon aria-hidden="true" />}
            title={syncCopy.history.errorTitle}
            description={syncCopy.history.errorDescription}
            actions={(
              <Button type="button" variant="secondary" onClick={() => void refetch()}>
                {syncCopy.actions.reload}
              </Button>
            )}
          />
        ) : null}
        {!isLoading && !error && data?.runs.length === 0 ? (
          <AppEmptyState
            media={<DatabaseIcon aria-hidden="true" />}
            title={syncCopy.history.emptyTitle}
            description={syncCopy.history.emptyDescription}
          />
        ) : null}
        {!isLoading && !error && data?.runs.length ? (
          <HistoryTimeline runs={data.runs} />
        ) : null}
      </div>
    </AppSheet>
  )
}
