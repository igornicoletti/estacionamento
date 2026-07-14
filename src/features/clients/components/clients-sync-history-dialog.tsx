import { SyncHistoryDialog } from "@/features/sync"
import { type ClientSyncHistoryEntry } from "../types/clients-sync-history-types"

interface ClientsSyncHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: readonly ClientSyncHistoryEntry[]
  isLoading: boolean
  error?: Error | string | null
  onRetry?: () => void
}

function getCounters(entry: ClientSyncHistoryEntry) {
  return [
    { label: "Clientes recebidos do ERP", value: entry.counters.clientsReceived },
    { label: "Clientes novos", value: entry.counters.clientsCreated },
    { label: "Clientes atualizados", value: entry.counters.clientsUpdated },
    { label: "Clientes sem alteração", value: entry.counters.clientsUnchanged },
    { label: "Clientes com falha", value: entry.counters.clientsFailed },
    { label: "Veículos recebidos do ERP", value: entry.counters.vehiclesReceived },
    { label: "Veículos novos", value: entry.counters.vehiclesCreated },
    { label: "Veículos atualizados", value: entry.counters.vehiclesUpdated },
    { label: "Veículos sem alteração", value: entry.counters.vehiclesUnchanged },
    { label: "Veículos com falha", value: entry.counters.vehiclesFailed },
  ]
}

export function ClientsSyncHistoryDialog({
  open,
  onOpenChange,
  entries,
  isLoading,
  error,
  onRetry,
}: ClientsSyncHistoryDialogProps) {
  return (
    <SyncHistoryDialog
      open={open}
      onOpenChange={onOpenChange}
      entries={entries}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      title="Histórico de sincronização"
      description="Acompanhe as últimas execuções de sincronização de clientes e veículos."
      emptyTitle="Ainda não há execuções registradas"
      emptyDescription="Nenhuma execução de sincronização foi registrada até o momento."
      getCounters={getCounters}
    />
  )
}
