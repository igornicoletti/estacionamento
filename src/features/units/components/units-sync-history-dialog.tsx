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

function getCounters(entry: UnitSyncHistoryEntry) {
  return [
    { label: "Unidades recebidas do ERP", value: entry.counters.received },
    { label: "Unidades novas", value: entry.counters.created },
    { label: "Unidades atualizadas", value: entry.counters.updated },
    { label: "Unidades sem alteração", value: entry.counters.unchanged },
    { label: "Unidades com falha", value: entry.counters.failed },
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
      title="Histórico de sincronização"
      description="Acompanhe as últimas execuções de sincronização de unidades."
      emptyTitle="Ainda não há execuções registradas"
      emptyDescription="Nenhuma execução de sincronização foi registrada até o momento."
      getCounters={getCounters}
    />
  )
}
