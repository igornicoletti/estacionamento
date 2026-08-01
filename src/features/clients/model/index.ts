export { getClientDetailItems, getClientVehicleDetailItems } from "./clients-details-model"
export {
  getClientVipStatus,
  getVehicleVipStatus,
  normalizeClientVipRuleRecord,
  normalizeClientVipRuleRecords,
  type ClientVipRuleRecord,
  type ClientVipRuleTargetType,
  type RawClientVipRuleRecord,
} from "./client-vip-rules"
export {
  formatClientDate,
  formatClientDocument,
  formatClientPhone,
  normalizeDisplayName,
  parseClientRouteId,
} from "./clients-formatters"
export {
  clientPayloadKeys,
  clientVehiclePayloadKeys,
  isClientSyncMode,
  isClientSyncStatus,
  isRecord,
  parseClientRows,
  parseClientVehicleRows,
  parseRows,
  parseRowsWithIssues,
  parseTriggerClientsSyncResult,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
} from "./clients-parsers"
export {
  normalizeCpfCnpj,
  normalizeEmail,
  normalizePhoneBr,
  normalizePlate,
  normalizeUf,
  normalizeYesNoSourceFlag,
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
  ClientSyncMode,
  ClientSyncStatus,
  ClientsMockScenario,
  ClientsSnapshot,
  ClientTableRow,
  ClientVehicle,
  ClientVehiclesSnapshot,
  ClientVehicleTableRow,
  ErpClientPayload,
  ErpClientVehiclePayload,
  ParseIssue,
  ParseRowsResult,
  TriggerClientsSyncResult,
  VipFlag,
} from "./clients-types"
