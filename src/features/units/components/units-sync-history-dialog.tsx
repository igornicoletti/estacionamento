import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  XCircleIcon,
} from "lucide-react"
import * as React from "react"

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
  type UnitSyncHistoryEntry,
  type UnitSyncRunMode,
  type UnitSyncRunStatus,
  type UnitSyncTrigger,
} from "../types/units-sync-history-types"

interface UnitsSyncHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: readonly UnitSyncHistoryEntry[]
  isLoading: boolean
}

const statusIconByType: Record<UnitSyncRunStatus, React.ComponentType<{ className?: string }>> = {
  failed: XCircleIcon,
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
}

const statusBadgeClassNameByType: Record<UnitSyncRunStatus, string> = {
  failed: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
}

const statusLabelByType: Record<UnitSyncRunStatus, string> = {
  failed: "Falhou",
  success: "Concluida",
  warning: "Concluida com alertas",
}

const modeLabelByType: Record<UnitSyncRunMode, string> = {
  full: "Completa",
  incremental: "Incremental",
}

const triggerLabelByType: Record<UnitSyncTrigger, string> = {
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
    return "—"
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}min ${seconds}s`
}

function renderCounters(entry: UnitSyncHistoryEntry) {
  return [
    {
      label: "Recebidos do ERP",
      value: entry.counters.received,
    },
    {
      label: "Novos no painel",
      value: entry.counters.created,
    },
    {
      label: "Atualizados no painel",
      value: entry.counters.updated,
    },
    {
      label: "Sem alteracao",
      value: entry.counters.unchanged,
    },
    {
      label: "Com falha",
      value: entry.counters.failed,
    },
  ]
}

function renderExecutionDetails(entry: UnitSyncHistoryEntry) {
  return [
    {
      key: "Inicio",
      value: formatDateTime(entry.startedAt),
    },
    {
      key: "Fim",
      value: entry.finishedAt ? formatDateTime(entry.finishedAt) : "—",
    },
    {
      key: "Duracao",
      value: formatDuration(entry.durationSeconds),
    },
    {
      key: "Origem",
      value: triggerLabelByType[entry.trigger],
    },
  ]
}

export function UnitsSyncHistoryDialog({
  open,
  onOpenChange,
  entries,
  isLoading,
}: UnitsSyncHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historico de sincronizacao</DialogTitle>
          <DialogDescription>
            Acompanhe as ultimas execucoes de sincronizacao das unidades.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {isLoading ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Carregando historico...
            </div>
          ) : null}

          {!isLoading && entries.length === 0 ? (
            <Empty className="min-h-32 rounded-md border border-dashed p-4">
              <EmptyHeader>
                <EmptyTitle>Ainda nao ha execucoes registradas</EmptyTitle>
                <EmptyDescription>
                  Nenhuma execução de sincronização foi registrada até o momento.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {!isLoading && entries.length > 0 ? (
            <ol className="relative ml-3 space-y-3 border-l border-border pl-4">
              {entries.map((entry) => {
                const StatusIcon = statusIconByType[entry.status]
                const counters = renderCounters(entry)
                const details = renderExecutionDetails(entry)

                return (
                  <li key={entry.id} className="relative">
                    <CircleDotIcon
                      aria-hidden="true"
                      className="absolute -left-5.75 top-4 size-3 bg-background text-muted-foreground"
                    />

                    <Collapsible defaultOpen={entry.status === "failed"} className="group/timeline-item">
                      <div className="rounded-lg bg-card p-3">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                    statusBadgeClassNameByType[entry.status]
                                  )}
                                >
                                  <StatusIcon className="size-3.5" />
                                  {statusLabelByType[entry.status]}
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {modeLabelByType[entry.mode]}
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {triggerLabelByType[entry.trigger]}
                                </span>
                              </div>

                              <p className="text-sm font-medium text-foreground">
                                {entry.message}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Inicio: {formatDateTime(entry.startedAt)} | Duracao: {formatDuration(entry.durationSeconds)}
                              </p>
                            </div>

                            <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/timeline-item:rotate-180" />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-3 space-y-3 pt-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {counters.map((counter) => (
                              <div
                                key={`${entry.id}-${counter.label}`}
                                className="rounded-md bg-muted/50 px-2 py-1.5"
                              >
                                <p className="text-xs text-muted-foreground">
                                  {counter.label}
                                </p>
                                <p className="text-xs font-semibold text-foreground">
                                  {counter.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Detalhes da execucao
                            </p>
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                              {details.map((detail) => (
                                <React.Fragment key={`${entry.id}-${detail.key}-${detail.value}`}>
                                  <p className="font-medium">{detail.key}</p>
                                  <p className="truncate">{detail.value}</p>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
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
