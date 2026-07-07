import { SyncHistoryDialog } from "@/components/sync-history/sync-history-dialog"

import { type UnitSyncHistoryEntry } from "../types/units-sync-history-types"

interface UnitsSyncHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: readonly UnitSyncHistoryEntry[]
  isLoading: boolean
  error?: Error | string | null
  onRetry?: () => void
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

export function UnitsSyncHistoryDialog({
  open,
  onOpenChange,
  entries,
  isLoading,
  error,
  onRetry,
}: UnitsSyncHistoryDialogProps) {
  return (
    <SyncHistoryDialog
      open={open}
      onOpenChange={onOpenChange}
      entries={entries}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      title="Historico de sincronizacao"
      description="Acompanhe as ultimas execucoes de sincronizacao das unidades."
      emptyTitle="Ainda nao ha execucoes registradas"
      emptyDescription="Nenhuma execucao de sincronizacao foi registrada ate o momento."
      getCounters={renderCounters}
    />
  )
}
