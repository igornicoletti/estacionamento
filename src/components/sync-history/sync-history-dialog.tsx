import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  RefreshCcwIcon,
  XCircleIcon,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import {
  type SyncHistoryCounter,
  type SyncHistoryEntry,
  type SyncRunMode,
  type SyncRunStatus,
  type SyncRunTrigger,
} from "./sync-history-types"

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {isLoading ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Carregando historico...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <Empty className="min-h-32 rounded-md border border-dashed p-4">
              <EmptyHeader>
                <EmptyTitle>Não foi possível carregar o histórico</EmptyTitle>
                <EmptyDescription>{errorMessage}</EmptyDescription>
              </EmptyHeader>
              {onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCcwIcon aria-hidden="true" />
                  {retryLabel}
                </Button>
              ) : null}
            </Empty>
          ) : null}

          {!isLoading && !errorMessage && entries.length === 0 ? (
            <Empty className="min-h-32 rounded-md border border-dashed p-4">
              <EmptyHeader>
                <EmptyTitle>{emptyTitle}</EmptyTitle>
                <EmptyDescription>{emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
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
                      <div className="rounded-lg bg-card p-3">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
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
                              </div>
                            </div>

                            <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/timeline-item:rotate-180" />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-3 space-y-3 pt-3">
                          <dl className="grid grid-cols-1 gap-4">
                            {details.map((detail) => (
                              <div key={`${entry.id}-${detail.key}-${detail.value}`} className="flex flex-col gap-0.5">
                                <dt className="text-xs text-muted-foreground">{detail.key}</dt>
                                <dd className="text-sm font-medium text-foreground">{detail.value}</dd>
                              </div>
                            ))}

                            {counters.map((counter) => (
                              <div key={`${entry.id}-${counter.label}`} className="flex flex-col gap-0.5">
                                <dt className="text-xs text-muted-foreground">{counter.label}</dt>
                                <dd className="text-sm font-medium text-foreground">{counter.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </li>
                )
              })}
            </ol>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
