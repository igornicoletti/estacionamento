export {
  listClientVipRules,
  toggleClientVipRule,
  toggleVehicleVipRule,
} from "./client-vip-rules-service"
export {
  isClientSyncInProgressError,
  triggerClientsSync,
} from "./client-sync-service"
export {
  configureClientsGateway,
  getClientsGateway,
  resetClientsGateway,
  type ClientsGateway,
} from "./clients-gateway"
export {
  listClientById,
  listClientVehiclesByClientId,
  listClients,
  listClientsSnapshot,
  listClientVehicles,
} from "./clients-service"
