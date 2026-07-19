export { getClientDetailItems, getClientVehicleDetailItems } from "./clients-details-model"
export { normalizeDisplayName, parseClientRouteId } from "./clients-formatters"
export {
  clientPayloadKeys,
  clientVehiclePayloadKeys,
  isClientSyncMode,
  isClientSyncStatus,
  isClientSyncTrigger,
  isRecord,
  parseClientRows,
  parseClientSyncHistory,
  parseClientSyncHistoryEntry,
  parseClientVehicleRows,
  parseRows,
  parseTriggerClientsSyncResult,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
} from "./clients-parsers"
export {
  sanitizeErpClientPayload,
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclePayload,
  sanitizeErpClientVehiclesPayload,
} from "./clients-normalizers"
export {
  mapClientToTableRow,
  mapClientVehicleToTableRow,
  resolveClientStatus,
  resolveVipFlag,
} from "./clients-table-mappers"
export type {
  Client,
  ClientStatus,
  ClientSyncCounters,
  ClientSyncHistoryEntry,
  ClientSyncMode,
  ClientsSnapshot,
  ClientSyncStatus,
  ClientSyncTrigger,
  ClientTableRow,
  ClientVehicle,
  ClientVehicleTableRow,
  ErpClientPayload,
  ErpClientVehiclePayload,
  TriggerClientsSyncResult,
  VipFlag,
} from "./clients-types"
