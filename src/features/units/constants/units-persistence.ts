export const UNITS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.units.table-column-visibility.v6"
export const UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.units.users.table-column-visibility.v4"
export const UNITS_CACHE_KEY = "units:list:v4"
export const UNIT_USER_STATS_CACHE_KEY = "units:user-stats:v2"
export const UNIT_USER_STATS_DISABLED_CACHE_KEY = "units:user-stats:disabled:v2"
export const UNIT_YARD_CONFIGS_CACHE_KEY = "units:yard-configs:v4"
export const UNIT_DETAIL_CACHE_KEY_PREFIX = "units:detail:v1"
export const UNITS_BATCH_SIZE = 500
export const UNITS_MAX_BATCHES = 20

export const DEFAULT_UNITS_COLUMN_VISIBILITY = {
  des_coordenada_empresa: false,
  ip_rede: false,
  nom_razao_social: false,
  sgl_estado: false,
} as const
