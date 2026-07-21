export const CLIENTS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.clients.table-column-visibility.v5"
export const CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY = "rmc.clients.vehicles.table-column-visibility.v4"
export const CLIENTS_CACHE_KEY = "clients:list:v3"
export const CLIENTS_SYNC_HISTORY_CACHE_KEY = "clients:sync-history:v3"
export const CLIENT_VEHICLES_CACHE_KEY_PREFIX = "clients:vehicles:v3"
export const CLIENT_VIP_RULES_CACHE_KEY = "clients:vip-rules:v2"
export const CLIENT_VIP_RULES_DISABLED_CACHE_KEY = "clients:vip-rules:disabled:v2"
export const CLIENTS_SYNC_HISTORY_LIMIT = 50
export const CLIENTS_BATCH_SIZE = 500
export const CLIENTS_MAX_BATCHES = 120

export const DEFAULT_CLIENTS_COLUMN_VISIBILITY = {
  des_email_1: false,
} as const

export const DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY = {
  cod_veiculo: false,
  nom_fantasia: false,
} as const
