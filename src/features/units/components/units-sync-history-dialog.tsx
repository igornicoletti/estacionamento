import { SyncHistoryDialog } from "@/features/sync"

import { unitsCopy } from "../constants"
import { type UnitSyncHistoryEntry } from "../model"

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
    { label: unitsCopy.sync.history.counters.received, value: entry.counters.received },
    { label: unitsCopy.sync.history.counters.created, value: entry.counters.created },
    { label: unitsCopy.sync.history.counters.updated, value: entry.counters.updated },
    { label: unitsCopy.sync.history.counters.unchanged, value: entry.counters.unchanged },
    { label: unitsCopy.sync.history.counters.failed, value: entry.counters.failed },
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
      title={unitsCopy.sync.history.title}
      description={unitsCopy.sync.history.description}
      emptyTitle={unitsCopy.sync.history.emptyTitle}
      emptyDescription={unitsCopy.sync.history.emptyDescription}
      getCounters={getCounters}
    />
  )
}
