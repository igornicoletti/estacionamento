import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
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
            <ol className="space-y-2">
              {entries.map((entry) => {
                const StatusIcon = statusIconByType[entry.status]
                const counters = getCounters(entry)
                const details = buildDetailRows(entry, counters)

                return (
                  <li key={entry.id}>
                    <Collapsible defaultOpen={false} className="group/timeline-item">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 text-left"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <CircleDotIcon
                                aria-hidden="true"
                                className="size-3 shrink-0 text-muted-foreground"
                              />
                              <p className="truncate text-sm font-medium text-foreground">
                                {formatDateTime(entry.startedAt)}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  statusBadgeClassNameByType[entry.status]
                                )}
                              >
                                <StatusIcon className="size-3.5" />
                                {statusLabelByType[entry.status]}
                              </span>
                            </div>

                            <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/timeline-item:rotate-180" />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-3 overflow-hidden rounded-md bg-background/70 p-3">
                          <dl className="grid gap-y-2 text-sm">
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
                            <p className="mt-3 rounded-md bg-muted/60 p-2 text-sm text-muted-foreground">
                              {entry.message}
                            </p>
                          ) : null}

                          {entry.errorDetails.length > 0 ? (
                            <div className="mt-3 rounded-md bg-destructive/5 p-3 text-sm text-destructive">
                              <div className="flex items-center gap-2 font-medium">
                                <AlertTriangleIcon aria-hidden="true" className="size-4" />
                                <p>Detalhes da falha</p>
                              </div>
                              <div className="mt-2 space-y-1 text-destructive/90">
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
