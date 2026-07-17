import { SyncHistoryDialog } from "@/features/sync"
import { type ClientSyncHistoryEntry } from "../types/clients-sync-history-types"
import { clientsCopy } from "../clients-copy"

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
    { label: clientsCopy.sync.history.counters.clientsReceived, value: entry.counters.clientsReceived },
    { label: clientsCopy.sync.history.counters.clientsCreated, value: entry.counters.clientsCreated },
    { label: clientsCopy.sync.history.counters.clientsUpdated, value: entry.counters.clientsUpdated },
    { label: clientsCopy.sync.history.counters.clientsUnchanged, value: entry.counters.clientsUnchanged },
    { label: clientsCopy.sync.history.counters.clientsFailed, value: entry.counters.clientsFailed },
    { label: clientsCopy.sync.history.counters.vehiclesReceived, value: entry.counters.vehiclesReceived },
    { label: clientsCopy.sync.history.counters.vehiclesCreated, value: entry.counters.vehiclesCreated },
    { label: clientsCopy.sync.history.counters.vehiclesUpdated, value: entry.counters.vehiclesUpdated },
    { label: clientsCopy.sync.history.counters.vehiclesUnchanged, value: entry.counters.vehiclesUnchanged },
    { label: clientsCopy.sync.history.counters.vehiclesFailed, value: entry.counters.vehiclesFailed },
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
      title={clientsCopy.sync.history.title}
      description={clientsCopy.sync.history.description}
      emptyTitle={clientsCopy.sync.history.emptyTitle}
      emptyDescription={clientsCopy.sync.history.emptyDescription}
      getCounters={getCounters}
    />
  )
}
