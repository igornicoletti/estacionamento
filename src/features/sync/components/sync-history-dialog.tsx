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
  success: "Concluida",
  warning: "Concluida com alertas",
}

const modeLabelByType: Record<SyncRunMode, string> = {
  full: "Completa",
  incremental: "Incremental",
}

const triggerLabelByType: Record<SyncRunTrigger, string> = {
  automatic: "Automatica",
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

function renderExecutionDetails(entry: SyncHistoryEntry) {
  return [
    {
      key: "Inicio",
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
    {
      key: "Duracao",
      value: formatDuration(entry.durationSeconds),
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
      <SheetContent className="data-[side=right]:w-[min(100vw,42rem)] data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl">
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
                  className="rounded-lg border p-3"
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
            <ol className="relative ml-3 space-y-3 border-l border-border pl-4">
              {entries.map((entry) => {
                const StatusIcon = statusIconByType[entry.status]
                const counters = getCounters(entry)
                const details = renderExecutionDetails(entry)

                return (
                  <li key={entry.id} className="relative">
                    <CircleDotIcon
                      aria-hidden="true"
                      className="absolute -left-5.75 top-4 size-3 bg-background text-muted-foreground"
                    />

                    <Collapsible defaultOpen={false} className="group/timeline-item">
                      <div className="rounded-lg border bg-card p-3">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 space-y-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {formatDateTime(entry.startedAt)}
                                </p>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                    statusBadgeClassNameByType[entry.status]
                                  )}
                                >
                                  <StatusIcon className="size-3.5" />
                                  {statusLabelByType[entry.status]}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {modeLabelByType[entry.mode]}
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {triggerLabelByType[entry.trigger]}
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {formatDuration(entry.durationSeconds)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {counters.map((counter) => (
                                  <span key={`${entry.id}-summary-${counter.label}`}>
                                    {counter.label}: <span className="font-medium text-foreground">{counter.value}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/timeline-item:rotate-180" />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-3 space-y-3 border-t pt-3">
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                            {details.map((detail) => (
                              <div key={`${entry.id}-${detail.key}-${detail.value}`} className="flex flex-col gap-0.5">
                                <dt className="text-xs text-muted-foreground">{detail.key}</dt>
                                <dd className="text-sm font-medium text-foreground">{detail.value}</dd>
                              </div>
                            ))}
                          </dl>

                          {entry.message ? (
                            <p className="rounded-md bg-muted/60 p-2 text-sm text-muted-foreground">
                              {entry.message}
                            </p>
                          ) : null}

                          {entry.errorDetails.length > 0 ? (
                            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2 text-sm text-destructive">
                              <p className="font-medium">Detalhes da falha</p>
                              <ul className="mt-1 list-disc space-y-1 pl-4">
                                {entry.errorDetails.map((detail) => (
                                  <li key={`${entry.id}-${detail}`}>{detail}</li>
                                ))}
                              </ul>
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
