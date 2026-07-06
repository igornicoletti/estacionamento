import { SyncHistoryDialog } from "@/components/sync-history/sync-history-dialog"

import { type ClientSyncHistoryEntry } from "../types/clients-sync-history-types"

interface ClientsSyncHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: readonly ClientSyncHistoryEntry[]
  isLoading: boolean
}

function renderCounters(entry: ClientSyncHistoryEntry) {
  return [
    {
      label: "Clientes recebidos do ERP",
      value: entry.counters.clientsReceived,
    },
    {
      label: "Clientes novos",
      value: entry.counters.clientsCreated,
    },
    {
      label: "Clientes atualizados",
      value: entry.counters.clientsUpdated,
    },
    {
      label: "Clientes sem alteracao",
      value: entry.counters.clientsUnchanged,
    },
    {
      label: "Clientes com falha",
      value: entry.counters.clientsFailed,
    },
    {
      label: "Veiculos recebidos do ERP",
      value: entry.counters.vehiclesReceived,
    },
    {
      label: "Veiculos novos",
      value: entry.counters.vehiclesCreated,
    },
    {
      label: "Veiculos atualizados",
      value: entry.counters.vehiclesUpdated,
    },
    {
      label: "Veiculos sem alteracao",
      value: entry.counters.vehiclesUnchanged,
    },
    {
      label: "Veiculos com falha",
      value: entry.counters.vehiclesFailed,
    },
  ]
}

export function ClientsSyncHistoryDialog({
  open,
  onOpenChange,
  entries,
  isLoading,
}: ClientsSyncHistoryDialogProps) {
  return (
    <SyncHistoryDialog
      open={open}
      onOpenChange={onOpenChange}
      entries={entries}
      isLoading={isLoading}
      title="Historico de sincronizacao"
      description="Acompanhe as ultimas execucoes de sincronizacao de clientes e veiculos."
      emptyTitle="Ainda nao ha execucoes registradas"
      emptyDescription="Nenhuma execucao de sincronizacao foi registrada ate o momento."
      getCounters={renderCounters}
    />
  )
}
