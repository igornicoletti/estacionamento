export type ClientStatus = "ativo" | "inativo"
export type VipFlag = "sim" | "nao"
export type ClientSyncMode = "full" | "incremental"
export type ClientSyncStatus = "success" | "warning" | "failed"
export type ClientSyncTrigger = "automatic" | "manual"

export interface ErpClientPayload {
  bloqueio_financeiro: unknown
  cod_pessoa: unknown
  des_email_1: unknown
  dta_cadastro: unknown
  dta_ultima_compra: unknown
  ind_pessoa_ativa: unknown
  is_active_120d?: unknown
  nom_cidade: unknown
  nom_fantasia: unknown
  nom_pessoa: unknown
  num_cnpj_cpf: unknown
  num_telefone_1: unknown
  qtd_veiculos: unknown
  sgl_estado: unknown
}

export interface Client {
  bloqueio_financeiro: string
  cod_pessoa: number
  des_email_1: string
  dta_cadastro: string
  dta_ultima_compra: string
  ind_pessoa_ativa: string
  is_active_120d: boolean
  nom_cidade: string
  nom_fantasia: string
  nom_pessoa: string
  num_cnpj_cpf: string
  num_telefone_1: string
  qtd_veiculos: number
  sgl_estado: string
}

export interface ClientTableRow extends Client {
  status: ClientStatus
  vip: VipFlag
}

export interface ErpClientVehiclePayload {
  cod_pessoa: unknown
  cod_veiculo: unknown
  des_veiculo: unknown
  nom_fantasia: unknown
  nom_motorista: unknown
  nom_pessoa: unknown
  num_cnpj_cpf: unknown
  num_placa: unknown
}

export interface ClientVehicle {
  cod_pessoa: number
  cod_veiculo: number
  des_veiculo: string
  nom_fantasia: string
  nom_motorista: string
  nom_pessoa: string
  num_cnpj_cpf: string
  num_placa: string
}

export interface ClientVehicleTableRow extends ClientVehicle {
  vip: VipFlag
}

export interface ClientsSnapshot {
  clients: Client[]
  vehicles: ClientVehicle[]
}

export interface ClientSyncCounters {
  clientsCreated: number
  clientsFailed: number
  clientsReceived: number
  clientsUnchanged: number
  clientsUpdated: number
  vehiclesCreated: number
  vehiclesFailed: number
  vehiclesReceived: number
  vehiclesUnchanged: number
  vehiclesUpdated: number
  [key: string]: number
}

export interface ClientSyncHistoryEntry {
  consecutiveFailures: number
  counters: ClientSyncCounters
  durationSeconds: number | null
  errorDetails: readonly string[]
  finishedAt: string | null
  id: string
  message: string
  mode: ClientSyncMode
  startedAt: string
  status: ClientSyncStatus
  trigger: ClientSyncTrigger
}

export interface TriggerClientsSyncResult {
  message: string
  runId: string | null
  status: ClientSyncStatus
}
