import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  RefreshCcwIcon,
  XCircleIcon,
} from "lucide-react"
import * as React from "react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import {
  type SyncHistoryCounter,
  type SyncHistoryEntry,
  type SyncRunMode,
  type SyncRunStatus,
  type SyncRunTrigger,
} from "../types/sync-history-types"

interface SyncHistoryDialogProps<TEntry extends SyncHistoryEntry> {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: readonly TEntry[]
  isLoading: boolean
  error?: Error | string | null
  onRetry?: () => void
  retryLabel?: string
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
  getCounters: (entry: TEntry) => readonly SyncHistoryCounter[]
}

const statusIconByType: Record<SyncRunStatus, React.ComponentType<{ className?: string }>> = {
  failed: XCircleIcon,
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
}

const statusBadgeClassNameByType: Record<SyncRunStatus, string> = {
  failed: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
}

const statusLabelByType: Record<SyncRunStatus, string> = {
  failed: "Falhou",
  success: "Concluída",
  warning: "Concluída com alertas",
}

const modeLabelByType: Record<SyncRunMode, string> = {
  full: "Completa",
  incremental: "Incremental",
}

const triggerLabelByType: Record<SyncRunTrigger, string> = {
  automatic: "Automática",
  manual: "Manual",
}

function formatDateTime(value: string) {
  const date = new Date(value)

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatDuration(durationSeconds: number | null) {
  if (durationSeconds === null || durationSeconds < 0) {
    return "-"
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}min ${seconds}s`
}

function buildDetailRows(
  entry: SyncHistoryEntry,
  counters: readonly SyncHistoryCounter[]
) {
  return [
    {
      key: "Duração",
      value: formatDuration(entry.durationSeconds),
    },
    ...counters.map((counter) => ({
      key: counter.label,
      value: String(counter.value),
    })),
    {
      key: "Início",
      value: formatDateTime(entry.startedAt),
    },
    {
      key: "Fim",
      value: entry.finishedAt ? formatDateTime(entry.finishedAt) : "-",
    },
    {
      key: "Modo",
      value: modeLabelByType[entry.mode],
    },
    {
      key: "Origem",
      value: triggerLabelByType[entry.trigger],
    },
  ]
}

export function SyncHistoryDialog<TEntry extends SyncHistoryEntry>({
  open,
  onOpenChange,
  entries,
  isLoading,
  error = null,
  onRetry,
  retryLabel = "Tentar novamente",
  title,
  description,
  emptyTitle,
  emptyDescription,
  getCounters,
}: SyncHistoryDialogProps<TEntry>) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="rounded-lg bg-muted/40 p-3"
                  style={{ opacity: Math.max(0.4, 1 - index * 0.25) }}
                >
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
          ) : null}

          {!isLoading && errorMessage ? (
            <AppEmptyState
              className="min-h-32 rounded-md border border-solid p-4"
              media={<AlertTriangleIcon />}
              title="Não foi possível carregar o histórico"
              description={errorMessage}
              actions={onRetry ? (
                <Button type="button" variant="outline" size="lg" onClick={onRetry}>
                  <RefreshCcwIcon aria-hidden="true" />
                  {retryLabel}
                </Button>
              ) : null}
            />
          ) : null}

          {!isLoading && !errorMessage && entries.length === 0 ? (
            <AppEmptyState
              className="min-h-32 rounded-md border border-solid p-4"
              media={<RefreshCcwIcon />}
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : null}

          {!isLoading && !errorMessage && entries.length > 0 ? (
            <ol className="relative ml-2 border-l-2 border-border/60 pl-4 space-y-3">
              {entries.map((entry) => {
                const StatusIcon = statusIconByType[entry.status]
                const counters = getCounters(entry)
                const details = buildDetailRows(entry, counters)

                return (
                  <li key={entry.id} className="relative">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-[-1.4rem] top-3 size-2.5 rounded-full ring-2 ring-background",
                        entry.status === "success" ? "bg-success" :
                          entry.status === "warning" ? "bg-warning" : "bg-destructive"
                      )}
                    />
                    <Collapsible defaultOpen={false} className="group/timeline-item">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 text-left"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-xs font-medium text-foreground">
                                {formatDateTime(entry.startedAt)}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium",
                                  statusBadgeClassNameByType[entry.status]
                                )}
                              >
                                <StatusIcon className="size-3" />
                                {statusLabelByType[entry.status]}
                              </span>
                            </div>

                            <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/timeline-item:rotate-180" />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-2 overflow-hidden rounded-md bg-background/60 p-2.5">
                          <dl className="grid gap-y-1.5 text-xs">
                            {details.map((detail) => (
                              <div
                                key={`${entry.id}-${detail.key}-${detail.value}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4"
                              >
                                <dt className="min-w-0 truncate text-muted-foreground">{detail.key}</dt>
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
      </SheetContent>
    </Sheet>
  )
}
