export const UNITS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.units.table-column-visibility.v5"
export const UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.units.users.table-column-visibility.v4"
export const UNITS_CACHE_KEY = "units:list:v3"
export const UNIT_USER_STATS_CACHE_KEY = "units:user-stats:v1"
export const UNIT_USER_STATS_DISABLED_CACHE_KEY = "units:user-stats:disabled:v1"
export const UNIT_SYNC_HISTORY_CACHE_KEY = "units:sync-history:v3"
export const UNIT_YARD_CONFIGS_CACHE_KEY = "units:yard-configs:v3"
export const UNIT_YARD_MOCK_STORAGE_KEY = "rmc.units.mock-yard-configs.v2"
export const UNIT_SYNC_HISTORY_LIMIT = 50

export const DEFAULT_UNITS_COLUMN_VISIBILITY = {
  des_coordenada_empresa: false,
  ip_rede: false,
  nom_razao_social: false,
} as const
