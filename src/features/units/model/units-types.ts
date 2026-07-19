export interface ErpUnitPayload {
  cod_empresa: unknown
  nom_razao_social: unknown
  nom_fantasia: unknown
  num_cnpj: unknown
  cod_bandeira: unknown
  des_bandeira: unknown
  cod_cidade: unknown
  nom_cidade: unknown
  nom_estado: unknown
  sgl_estado: unknown
  des_coordenada_empresa: unknown
  ip_rede: unknown
  nom_banco_dados: unknown
}

export interface Unit {
  cod_empresa: number
  nom_razao_social: string
  nom_fantasia: string
  num_cnpj: string
  cod_bandeira: number
  des_bandeira: string
  cod_cidade: number
  nom_cidade: string
  nom_estado: string
  sgl_estado: string
  des_coordenada_empresa: string
  ip_rede: string
  nom_banco_dados: string
}

export interface UnitYardConfig {
  unitId: string
  patioActive: boolean
  parkingSpots: number
  updatedAt: string
}

export interface UpsertUnitYardConfigInput {
  unitId: string
  unitName?: string
  patioActive: boolean
  parkingSpots: number
}

export interface UnitUserStats {
  managers: number
  operators: number
}

export interface UnitSyncCounters {
  received: number
  created: number
  updated: number
  unchanged: number
  failed: number
  [key: string]: number
}

export type UnitSyncRunMode = "full" | "incremental"
export type UnitSyncTrigger = "automatic" | "manual"
export type UnitSyncRunStatus = "success" | "warning" | "failed"

export interface UnitSyncHistoryEntry {
  id: string
  mode: UnitSyncRunMode
  trigger: UnitSyncTrigger
  status: UnitSyncRunStatus
  startedAt: string
  finishedAt: string | null
  durationSeconds: number | null
  message: string
  counters: UnitSyncCounters
  consecutiveFailures: number
  errorDetails: string[]
}

export interface TriggerUnitsSyncResult {
  runId: string | null
  status: UnitSyncRunStatus
  message: string
}

export type YardStatusFormValue = "active" | "inactive"
