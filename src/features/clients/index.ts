export { clientsCopy } from "./clients-copy"
export { createClientVehiclesColumns } from "./columns/client-vehicles-columns"
export { createClientsColumns } from "./columns/clients-columns"
export { ClientsSyncHistoryDialog } from "./components/clients-sync-history-dialog"
export { useClientSyncHistory } from "./hooks/use-client-sync-history"
export { useClientVehicles } from "./hooks/use-client-vehicles"
export { useClients } from "./hooks/use-clients"
export { ClientVehiclesRoute } from "./routes/client-vehicles-route"
export { ClientsRoute } from "./routes/clients-route"
export { listClientSyncHistory } from "./services/client-sync-history-service"
export { triggerClientsSync, type ClientSyncMode } from "./services/client-sync-service"
export {
  configureClientsGateway,
  getClientsGateway,
  resetClientsGateway,
  type ClientsGateway,
} from "./services/clients-gateway"
export { listClients, listClientsSnapshot, listClientVehicles } from "./services/clients-service"
export type { ClientSyncCounters, ClientSyncHistoryEntry } from "./types/clients-sync-history-types"
export type {
  Client,
  ClientTableRow,
  ClientVehicle,
  ClientVehicleTableRow,
  ErpClientPayload,
  ErpClientVehiclePayload,
  VipFlag,
} from "./types/clients-types"
export { getClientDetailItems, getClientVehicleDetailItems } from "./utils/clients-details-model"
export {
  sanitizeErpClientPayload,
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclePayload,
  sanitizeErpClientVehiclesPayload,
} from "./utils/clients-normalizers"
export {
  mapClientToTableRow,
  mapClientVehicleToTableRow,
  resolveClientStatus,
  resolveVipFlag,
} from "./utils/clients-table-mappers"
