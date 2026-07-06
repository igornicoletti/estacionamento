export { clientsCopy } from "./clients-copy"
export { createClientVehiclesColumns } from "./columns/client-vehicles-columns"
export { createClientsColumns } from "./columns/clients-columns"
export { useClientVehicles } from "./hooks/use-client-vehicles"
export { useClients } from "./hooks/use-clients"
export { ClientVehiclesRoute } from "./routes/client-vehicles-route"
export { ClientsRoute } from "./routes/clients-route"
export {
  configureClientsGateway,
  getClientsGateway,
  resetClientsGateway,
  type ClientsGateway
} from "./services/clients-gateway"
export {
  listClients, listClientsSnapshot, listClientVehicles
} from "./services/clients-service"
export type {
  Client,
  ClientVehicle,
  ErpClientPayload,
  ErpClientVehiclePayload,
  VipFlag
} from "./types/clients-types"
export {
  sanitizeErpClientPayload,
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclePayload,
  sanitizeErpClientVehiclesPayload
} from "./utils/clients-normalizers"
export {
  mapClientToTableRow,
  mapClientVehicleToTableRow,
  resolveClientStatus,
  resolveVipFlag
} from "./utils/clients-table-mappers"
