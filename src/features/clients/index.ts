export { ClientsSyncHistoryDialog } from "./components"
export { clientsCopy } from "./constants"
export { useClients, useClientSyncHistory, useClientVehicles } from "./hooks"
export {
  getClientDetailItems,
  getClientVehicleDetailItems,
  mapClientToTableRow,
  mapClientVehicleToTableRow,
  normalizeDisplayName,
  parseClientRouteId,
  resolveClientStatus,
  resolveVipFlag,
  sanitizeErpClientPayload,
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclePayload,
  sanitizeErpClientVehiclesPayload,
  type Client,
  type ClientStatus,
  type ClientSyncCounters,
  type ClientSyncHistoryEntry,
  type ClientSyncMode,
  type ClientsSnapshot,
  type ClientSyncStatus,
  type ClientSyncTrigger,
  type ClientTableRow,
  type ClientVehicle,
  type ClientVehicleTableRow,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
  type TriggerClientsSyncResult,
  type VipFlag,
} from "./model"
export { ClientVehiclesRoute, ClientsRoute } from "./routes"
export {
  configureClientsGateway,
  getClientsGateway,
  isClientSyncInProgressError,
  listClients,
  listClientsSnapshot,
  listClientSyncHistory,
  listClientVehicles,
  resetClientsGateway,
  triggerClientsSync,
  type ClientsGateway,
} from "./services"
export {
  createClientStatusFilterOptions,
  createClientsColumns,
  createClientVehiclesColumns,
  createClientVipFilterOptions,
  createVehiclePlateFilterOptions,
  createVehicleVipFilterOptions,
} from "./table"
