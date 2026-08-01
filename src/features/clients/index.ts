export { ClientsRoute } from "./routes/clients-route"
export { ClientVehiclesRoute } from "./routes/client-vehicles-route"
export { createClientsColumns } from "./table"
export { createClientVehiclesColumns } from "./table"
export { useClients } from "./hooks/use-clients"
export { useClientVehicles } from "./hooks/use-client-vehicles"
export {
  configureClientsGateway,
  getClientsGateway,
  isClientSyncInProgressError,
  listClientById,
  listClientVehicles,
  listClientVehiclesByClientId,
  listClients,
  listClientsSnapshot,
  resetClientsGateway,
  triggerClientsSync,
  type ClientsGateway,
} from "./services"
export {
  sanitizeErpClientPayload,
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclePayload,
  sanitizeErpClientVehiclesPayload,
} from "./model"
export type {
  Client,
  ClientVehicle,
  ErpClientPayload,
  ErpClientVehiclePayload,
} from "./model"
