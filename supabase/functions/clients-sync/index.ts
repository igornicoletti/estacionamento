import {
  createAdminClient,
  fetchWithErpRetryAndDoH,
  getAuthenticatedActor,
  getCorsHeaders,
  handleCors,
  jsonResponse,
  requirePermissionActor,
  resolveErpBaseUrl,
  writeAuditEvent,
} from "../_shared/index.ts"
import { deduplicateVehicles } from "./deduplicate-vehicles.ts"
import { buildSourceHash } from "./source-hash.ts"
import {
  isVehicleSyncCursorExpired,
  parseVehicleSyncCursor,
  serializeVehicleSyncCursor,
  type VehicleSyncCursor,
} from "./sync-cursor.ts"
import {
  DEFAULT_VEHICLE_PARTITION_COUNT,
  resolveVehiclePartitionIndex,
} from "./vehicle-partition.ts"

type SyncMode = "full" | "incremental"
type SyncScope = "clients" | "vehicles"
type SyncTrigger = "automatic" | "manual"
type SyncStatus = "success" | "warning" | "failed"

type UpsertableTable = {
  upsert(
    rows: readonly object[],
    options: { onConflict: string }
  ): Promise<{ error: unknown }>
}

const clientsSyncLockResource = "clients-sync"
const clientsSyncLockTtlSeconds = 300
const syncUpsertChunkSize = 500
const maxHashDiffIds = 5000
const maxFailureDetails = 100
const erpDefaultTimeoutMs = 30_000
const erpMinTimeoutMs = 5_000
const erpMaxTimeoutMs = 180_000

interface NormalizedClientRow {
  cod_pessoa: number
  nom_pessoa: string
  nom_fantasia: string
  num_cnpj_cpf: string
  des_email_1: string
  num_telefone_1: string
  nom_cidade: string
  sgl_estado: string
  dta_cadastro: string | null
  ind_pessoa_ativa: string
  bloqueio_financeiro: string
  qtd_veiculos: number
  dta_ultima_compra: string | null
  is_active_120d: boolean
  source_hash: string
  source_updated_at: string | null
  synced_at: string
}

interface NormalizedVehicleRow {
  cod_veiculo: number
  cod_pessoa: number
  nom_pessoa: string
  nom_fantasia: string
  num_cnpj_cpf: string
  num_placa: string
  des_veiculo: string
  nom_motorista: string
  client_is_active_120d: boolean
  source_hash: string
  source_updated_at: string | null
  synced_at: string
}

interface NormalizedClientResult {
  row: NormalizedClientRow | null
  inactive: boolean
}

interface SyncStateRow {
  last_full_sync_at: string | null
  last_incremental_sync_at: string | null
  last_successful_sync_at: string | null
  last_cursor: string | null
  consecutive_failures: number
}

function requireEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required env ${name}`)
  }

  return value
}

function resolveErpTimeoutMs() {
  const rawTimeout = Deno.env.get("ERP_REQUEST_TIMEOUT_MS")?.trim()

  if (!rawTimeout) {
    return erpDefaultTimeoutMs
  }

  const parsed = Number(rawTimeout)

  if (!Number.isFinite(parsed)) {
    throw new Error("ERP_REQUEST_TIMEOUT_MS inválido. Informe um número em milissegundos.")
  }

  return Math.min(erpMaxTimeoutMs, Math.max(erpMinTimeoutMs, Math.trunc(parsed)))
}

function resolveSyncErrorResponse(message: string) {
  if (message === "erp_timeout") {
    return {
      status: 504,
      message: "O ERP não respondeu a tempo. Tente novamente em instantes.",
    }
  }

  if (message === "erp_http_401" || message === "erp_http_403") {
    return {
      status: 502,
      message: "Falha de autenticação no ERP. Verifique os tokens da integração.",
    }
  }

  if (message.startsWith("erp_http_")) {
    return {
      status: 502,
      message: "O ERP retornou erro durante a sincronização. Tente novamente mais tarde.",
    }
  }

  if (/invalid peer certificate|notvalidforname/i.test(message)) {
    return {
      status: 502,
      message: "Erro de comunicação com o sistema externo. Contate o suporte.",
    }
  }

  if (message.startsWith("Missing required env ERP_") || message.startsWith("ERP_")) {
    return {
      status: 500,
      message: "Erro de configuração interna. Contate o suporte.",
    }
  }

  return {
    status: 500,
    message: "Não foi possível sincronizar os clientes agora.",
  }
}

async function tryAcquireSyncLock(
  mode: SyncMode,
  scope: SyncScope,
  partitionIndex: number | null,
  trigger: SyncTrigger,
  requestedBy: string | null
) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc("acquire_sync_lock", {
    p_resource: clientsSyncLockResource,
    p_ttl_seconds: clientsSyncLockTtlSeconds,
    p_metadata: {
      mode,
      partitionIndex,
      scope,
      trigger,
      requestedBy,
    },
  })

  if (error) {
    throw new Error("sync_lock_error", { cause: error })
  }

  return Boolean(data)
}

async function releaseSyncLock() {
  const supabase = createAdminClient()
  const { error } = await supabase.rpc("release_sync_lock", {
    p_resource: clientsSyncLockResource,
  })

  if (error) {
    console.error("[clients-sync:release-lock-error]", error.message)
  }
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === "string") {
    const normalized = value.trim()

    if (!normalized) {
      return null
    }

    const parsed = Number(normalized)

    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed)
    }
  }

  return null
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const input = value.trim()
  const date = new Date(input)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function resolveYesNoFlag(value: string) {
  return value.trim().toUpperCase() === "S"
}

function resolveActive120d(
  indPessoaAtiva: string,
  lastPurchaseDate: string | null,
  activeThresholdMs: number
) {
  if (!resolveYesNoFlag(indPessoaAtiva) || !lastPurchaseDate) {
    return false
  }

  const purchaseDate = new Date(lastPurchaseDate)

  if (Number.isNaN(purchaseDate.getTime())) {
    return false
  }

  purchaseDate.setHours(0, 0, 0, 0)

  return purchaseDate.getTime() >= activeThresholdMs
}

function resolveSyncMode(value: unknown): SyncMode {
  return value === "full" ? "full" : "incremental"
}

function resolveSyncScope(value: unknown): SyncScope {
  return value === "vehicles" ? "vehicles" : "clients"
}

function resolveRequestedPartition(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null
  }

  return value
}

function resolveSyncTrigger(value: unknown): SyncTrigger {
  return value === "automatic" ? "automatic" : "manual"
}

function coercePayloadArray(raw: unknown, aliases: readonly string[]) {
  if (Array.isArray(raw)) {
    return raw
  }

  if (raw && typeof raw === "object") {
    const candidate = raw as Record<string, unknown>

    for (const key of aliases) {
      if (Array.isArray(candidate[key])) {
        return candidate[key] as unknown[]
      }
    }
  }

  return [] as unknown[]
}

function normalizeClient(
  raw: unknown,
  syncedAt: string,
  activeThresholdMs: number
): NormalizedClientResult {
  if (!raw || typeof raw !== "object") {
    return { row: null, inactive: false }
  }

  const candidate = raw as Record<string, unknown>
  const codPessoa = normalizeNumber(candidate.cod_pessoa)

  if (codPessoa === null) {
    return { row: null, inactive: false }
  }

  const indPessoaAtiva = normalizeText(candidate.ind_pessoa_ativa).toUpperCase()
  const dtaUltimaCompra = normalizeDate(candidate.dta_ultima_compra)
  const dtaCadastro = normalizeDate(candidate.dta_cadastro)

  const base = {
    cod_pessoa: codPessoa,
    nom_pessoa: normalizeText(candidate.nom_pessoa),
    nom_fantasia: normalizeText(candidate.nom_fantasia),
    num_cnpj_cpf: normalizeText(candidate.num_cnpj_cpf),
    des_email_1: normalizeText(candidate.des_email_1),
    num_telefone_1: normalizeText(candidate.num_telefone_1),
    nom_cidade: normalizeText(candidate.nom_cidade),
    sgl_estado: normalizeText(candidate.sgl_estado).slice(0, 2).toUpperCase(),
    dta_cadastro: dtaCadastro,
    ind_pessoa_ativa: indPessoaAtiva,
    bloqueio_financeiro: normalizeText(candidate.bloqueio_financeiro).toUpperCase(),
    qtd_veiculos: Math.max(0, normalizeNumber(candidate.qtd_veiculos) ?? 0),
    dta_ultima_compra: dtaUltimaCompra,
    is_active_120d: resolveActive120d(
      indPessoaAtiva,
      dtaUltimaCompra,
      activeThresholdMs
    ),
    source_updated_at:
      typeof candidate.updated_at === "string" && candidate.updated_at.trim().length > 0
        ? candidate.updated_at
        : null,
  }

  if (!base.nom_pessoa) {
    return { row: null, inactive: false }
  }

  if (!base.is_active_120d) {
    return { row: null, inactive: true }
  }

  return {
    inactive: false,
    row: {
      ...base,
      source_hash: buildSourceHash([
        base.cod_pessoa,
        base.nom_pessoa,
        base.nom_fantasia,
        base.num_cnpj_cpf,
        base.des_email_1,
        base.num_telefone_1,
        base.nom_cidade,
        base.sgl_estado,
        base.dta_cadastro,
        base.ind_pessoa_ativa,
        base.bloqueio_financeiro,
        base.qtd_veiculos,
        base.dta_ultima_compra,
        base.is_active_120d,
        base.source_updated_at,
      ]),
      synced_at: syncedAt,
    },
  }
}

function normalizeVehicle(
  raw: unknown,
  syncedAt: string
): Omit<NormalizedVehicleRow, "client_is_active_120d"> | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const candidate = raw as Record<string, unknown>
  const codVeiculo = normalizeNumber(candidate.cod_veiculo)
  const codPessoa = normalizeNumber(candidate.cod_pessoa)

  if (codVeiculo === null || codPessoa === null) {
    return null
  }

  const base = {
    cod_veiculo: codVeiculo,
    cod_pessoa: codPessoa,
    nom_pessoa: normalizeText(candidate.nom_pessoa),
    nom_fantasia: normalizeText(candidate.nom_fantasia),
    num_cnpj_cpf: normalizeText(candidate.num_cnpj_cpf),
    num_placa: normalizeText(candidate.num_placa).toUpperCase(),
    des_veiculo: normalizeText(candidate.des_veiculo),
    nom_motorista: normalizeText(candidate.nom_motorista),
    source_updated_at:
      typeof candidate.updated_at === "string" && candidate.updated_at.trim().length > 0
        ? candidate.updated_at
        : null,
  }

  if (!base.num_placa || !base.nom_pessoa) {
    return null
  }

  return {
    ...base,
    source_hash: buildSourceHash([
      base.cod_veiculo,
      base.cod_pessoa,
      base.nom_pessoa,
      base.nom_fantasia,
      base.num_cnpj_cpf,
      base.num_placa,
      base.des_veiculo,
      base.nom_motorista,
      base.source_updated_at,
    ]),
    synced_at: syncedAt,
  }
}

async function fetchErpResource(options: {
  endpointEnvName: string
  defaultEndpoint: string
  updatedSinceParamEnvName: string
  defaultUpdatedSinceParam: string
  mode: SyncMode
  lastSuccessfulSyncAt: string | null
  payloadAliases: readonly string[]
}) {
  const baseUrl = resolveErpBaseUrl()
  const endpoint = Deno.env.get(options.endpointEnvName) || options.defaultEndpoint
  const updatedSinceParam =
    Deno.env.get(options.updatedSinceParamEnvName) || options.defaultUpdatedSinceParam
  const apiToken = Deno.env.get("ERP_API_TOKEN")?.trim() || null
  const bearerToken = apiToken
    ? null
    : Deno.env.get("ERP_BEARER_TOKEN")?.trim() || null
  const username = apiToken || bearerToken
    ? null
    : requireEnv("ERP_BASIC_USERNAME")
  const password = apiToken || bearerToken
    ? null
    : requireEnv("ERP_BASIC_PASSWORD")
  const timeoutMs = resolveErpTimeoutMs()

  const url = new URL(endpoint, baseUrl)

  if (options.mode === "incremental" && options.lastSuccessfulSyncAt) {
    url.searchParams.set(updatedSinceParam, options.lastSuccessfulSyncAt)
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  if (apiToken) {
    headers["X-API-Token"] = apiToken
  } else {
    headers.Authorization = bearerToken
      ? `Bearer ${bearerToken}`
      : `Basic ${btoa(`${username}:${password}`)}`
  }

  const response = await fetchWithErpRetryAndDoH(url, headers, timeoutMs)

  const data = await response.json()

  return coercePayloadArray(data, options.payloadAliases)
}

async function fetchErpClients(mode: SyncMode, lastSuccessfulSyncAt: string | null) {
  return fetchErpResource({
    endpointEnvName: "ERP_CLIENTS_ENDPOINT",
    defaultEndpoint: "/clients",
    updatedSinceParamEnvName: "ERP_CLIENTS_UPDATED_SINCE_PARAM",
    defaultUpdatedSinceParam: "updated_since",
    mode,
    lastSuccessfulSyncAt,
    payloadAliases: ["data", "items", "results", "clientes"],
  })
}

async function fetchErpVehicles(mode: SyncMode, lastSuccessfulSyncAt: string | null) {
  return fetchErpResource({
    endpointEnvName: "ERP_CLIENT_VEHICLES_ENDPOINT",
    defaultEndpoint: "/client-vehicles",
    updatedSinceParamEnvName: "ERP_CLIENT_VEHICLES_UPDATED_SINCE_PARAM",
    defaultUpdatedSinceParam: "updated_since",
    mode,
    lastSuccessfulSyncAt,
    payloadAliases: ["data", "items", "results", "veiculos", "placas"],
  })
}

async function getSyncState() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("client_sync_state")
    .select("last_full_sync_at, last_incremental_sync_at, last_successful_sync_at, last_cursor, consecutive_failures")
    .eq("singleton_key", true)
    .single()

  if (error || !data) {
    return {
      last_full_sync_at: null,
      last_incremental_sync_at: null,
      last_successful_sync_at: null,
      last_cursor: null,
      consecutive_failures: 0,
    } as SyncStateRow
  }

  return data as SyncStateRow
}

async function saveSyncState(
  mode: SyncMode,
  status: SyncStatus,
  checkpointAt: string,
  clearCursor = false
) {
  const supabase = createAdminClient()
  const success = status === "success" || status === "warning"

  const { data: current } = await supabase
    .from("client_sync_state")
    .select("consecutive_failures")
    .eq("singleton_key", true)
    .single()

  const nextConsecutiveFailures = success
    ? 0
    : Number(current?.consecutive_failures ?? 0) + 1

  const payload: Record<string, unknown> = {
    singleton_key: true,
    consecutive_failures: nextConsecutiveFailures,
  }

  if (success) {
    if (mode === "full") {
      payload.last_full_sync_at = checkpointAt
    } else {
      payload.last_incremental_sync_at = checkpointAt
    }

    payload.last_successful_sync_at = checkpointAt
  }

  if (clearCursor) {
    payload.last_cursor = null
  }

  const { error } = await supabase
    .from("client_sync_state")
    .upsert(payload, { onConflict: "singleton_key" })

  if (error) {
    throw new Error("client_sync_state_update_failed", { cause: error })
  }

  return nextConsecutiveFailures
}

async function saveSyncCursor(cursor: VehicleSyncCursor) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("client_sync_state")
    .update({ last_cursor: serializeVehicleSyncCursor(cursor) })
    .eq("singleton_key", true)

  if (error) {
    throw new Error("client_sync_cursor_update_failed", { cause: error })
  }
}

function computeUpsertCounters<
  T extends { source_hash: string },
  TKey extends number | string,
>(
  incomingRows: readonly T[],
  existingHashById: ReadonlyMap<TKey, string>,
  resolveId: (row: T) => TKey
) {
  let created = 0
  let updated = 0
  let unchanged = 0

  for (const row of incomingRows) {
    const id = resolveId(row)
    const previousHash = existingHashById.get(id)

    if (!previousHash) {
      created += 1
      continue
    }

    if (previousHash === row.source_hash) {
      unchanged += 1
    } else {
      updated += 1
    }
  }

  return {
    created,
    updated,
    unchanged,
  }
}

async function upsertRowsInChunks<T extends object>(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  rows: readonly T[],
  onConflict: string
) {
  if (rows.length === 0) {
    return
  }

  for (let start = 0; start < rows.length; start += syncUpsertChunkSize) {
    const chunk = rows.slice(start, start + syncUpsertChunkSize)
    const tableClient = supabase.from(table) as unknown as UpsertableTable
    const { error } = await tableClient.upsert(chunk, { onConflict })

    if (error) {
      throw error
    }
  }
}

async function listActiveClientIds(
  supabase: ReturnType<typeof createAdminClient>,
  clientIds: readonly number[]
) {
  const activeIds = new Set<number>()
  const uniqueClientIds = Array.from(new Set(clientIds))
  const pageSize = 500

  for (let offset = 0; offset < uniqueClientIds.length; offset += pageSize) {
    const page = uniqueClientIds.slice(offset, offset + pageSize)
    const { data, error } = await supabase
      .from("erp_clients")
      .select("cod_pessoa")
      .in("cod_pessoa", page)
      .eq("is_active_120d", true)

    if (error) {
      throw new Error("active_clients_lookup_failed", { cause: error })
    }

    for (const row of data ?? []) {
      activeIds.add(Number(row.cod_pessoa))
    }
  }

  return activeIds
}

async function runSync(
  mode: SyncMode,
  scope: SyncScope,
  requestedPartition: number | null,
  trigger: SyncTrigger,
  requestedBy: string | null
) {
  const supabase = createAdminClient()
  const startedAtDate = new Date()
  const startedAt = startedAtDate.toISOString()
  const activeThreshold = new Date(startedAtDate)
  activeThreshold.setHours(0, 0, 0, 0)
  activeThreshold.setDate(activeThreshold.getDate() - 120)
  const state = await getSyncState()
  const persistedCursor = parseVehicleSyncCursor(state.last_cursor)
  let vehicleCursor: VehicleSyncCursor | null = null
  let vehiclePartition = 0

  if (
    scope === "clients" &&
    persistedCursor &&
    !isVehicleSyncCursorExpired(persistedCursor, startedAtDate.getTime())
  ) {
    return {
      runId: null,
      status: "warning" as const,
      message: "Já existe um ciclo de sincronização de veículos em andamento.",
    }
  }

  if (scope === "vehicles") {
    if (!persistedCursor || isVehicleSyncCursorExpired(persistedCursor, startedAtDate.getTime())) {
      return {
        runId: null,
        status: "warning" as const,
        message: "Não existe um ciclo de veículos ativo para continuar.",
      }
    }

    if (persistedCursor.mode !== mode || requestedPartition === null) {
      return {
        runId: null,
        status: "warning" as const,
        message: "A fase solicitada não corresponde ao ciclo de sincronização ativo.",
      }
    }

    if (requestedPartition < persistedCursor.nextPartition) {
      return {
        runId: null,
        status: "warning" as const,
        message: "Esta partição de veículos já foi processada.",
      }
    }

    if (requestedPartition > persistedCursor.nextPartition) {
      return {
        runId: null,
        status: "warning" as const,
        message: "A partição anterior de veículos ainda não foi concluída.",
      }
    }

    vehicleCursor = persistedCursor
    vehiclePartition = requestedPartition
    trigger = persistedCursor.trigger
    requestedBy = persistedCursor.requestedBy
  }

  const failedItems: Array<Record<string, unknown>> = []
  let failedClientCount = 0
  let failedVehicleCount = 0
  let skippedInactiveClients = 0
  let skippedInactiveVehicles = 0

  const recordFailure = (entity: "client" | "vehicle", index: number) => {
    if (failedItems.length < maxFailureDetails) {
      failedItems.push({ entity, index, reason: "invalid_payload" })
    }
  }

  const rawClients = scope === "vehicles"
    ? []
    : await fetchErpClients(mode, state.last_successful_sync_at)
  const clientsReceived = rawClients.length
  const normalizedClients: NormalizedClientRow[] = []

  for (const [index, item] of rawClients.entries()) {
    const normalized = normalizeClient(item, startedAt, activeThreshold.getTime())

    if (normalized.inactive) {
      skippedInactiveClients += 1
      continue
    }

    if (!normalized.row) {
      failedClientCount += 1
      recordFailure("client", index)
      continue
    }

    normalizedClients.push(normalized.row)
  }

  rawClients.length = 0

  const clientIds = normalizedClients.map((row) => row.cod_pessoa)
  const shouldSkipClientHashDiff = clientIds.length > maxHashDiffIds
  const { data: existingClients } = !shouldSkipClientHashDiff && clientIds.length
    ? await supabase
      .from("erp_clients")
      .select("cod_pessoa, source_hash")
      .in("cod_pessoa", clientIds)
    : { data: [] as Array<{ cod_pessoa: number; source_hash: string }> }

  const existingClientHashById = new Map(
    (existingClients ?? []).map((row) => [Number(row.cod_pessoa), String(row.source_hash)])
  )

  const clientCounters = shouldSkipClientHashDiff
    ? {
      created: normalizedClients.length,
      updated: 0,
      unchanged: 0,
    }
    : computeUpsertCounters(
      normalizedClients,
      existingClientHashById,
      (row) => row.cod_pessoa
    )

  if (normalizedClients.length > 0) {
    try {
      await upsertRowsInChunks(supabase, "erp_clients", normalizedClients, "cod_pessoa")
    } catch (clientsUpsertError) {
      throw new Error("clients_upsert_failed", { cause: clientsUpsertError })
    }
  }

  const syncedClientCount = normalizedClients.length
  normalizedClients.length = 0

  const rawVehicles = scope === "clients"
    ? []
    : await fetchErpVehicles(mode, vehicleCursor?.checkpoint ?? state.last_successful_sync_at)
  const vehiclesSourceTotal = rawVehicles.length
  let vehiclesReceived = 0
  const collectedVehicles: NormalizedVehicleRow[] = []
  const partitionCount = vehicleCursor?.partitionCount ?? DEFAULT_VEHICLE_PARTITION_COUNT

  for (const [index, item] of rawVehicles.entries()) {
    const candidate = item && typeof item === "object"
      ? item as Record<string, unknown>
      : null
    const plate = candidate ? normalizeText(candidate.num_placa) : ""

    if (resolveVehiclePartitionIndex(plate, partitionCount) !== vehiclePartition) {
      continue
    }

    vehiclesReceived += 1
    const vehicle = normalizeVehicle(item, startedAt)

    if (!vehicle) {
      failedVehicleCount += 1
      recordFailure("vehicle", index)
      continue
    }

    collectedVehicles.push({
      ...vehicle,
      client_is_active_120d: true,
    })
  }

  rawVehicles.length = 0

  const {
    rows: uniqueVehicles,
    collapsed: collapsedDuplicateVehicles,
  } = deduplicateVehicles(collectedVehicles)
  collectedVehicles.length = 0

  const allActiveClientIds = await listActiveClientIds(
    supabase,
    uniqueVehicles.map((row) => row.cod_pessoa)
  )
  const normalizedVehicles = uniqueVehicles.filter((vehicle) => {
    if (allActiveClientIds.has(vehicle.cod_pessoa)) {
      return true
    }

    skippedInactiveVehicles += 1
    return false
  })
  uniqueVehicles.length = 0

  const vehiclePlates = normalizedVehicles.map((row) => row.num_placa)
  const shouldSkipVehicleHashDiff = vehiclePlates.length > maxHashDiffIds
  const { data: existingVehicles } = !shouldSkipVehicleHashDiff && vehiclePlates.length
    ? await supabase
      .from("erp_client_vehicles")
      .select("num_placa, source_hash")
      .in("num_placa", vehiclePlates)
    : { data: [] as Array<{ num_placa: string; source_hash: string }> }

  const existingVehicleHashByPlate = new Map(
    (existingVehicles ?? []).map((row) => [String(row.num_placa), String(row.source_hash)])
  )

  const vehicleCounters = shouldSkipVehicleHashDiff
    ? {
      created: normalizedVehicles.length,
      updated: 0,
      unchanged: 0,
    }
    : computeUpsertCounters(
      normalizedVehicles,
      existingVehicleHashByPlate,
      (row) => row.num_placa
    )

  if (normalizedVehicles.length > 0) {
    try {
      await upsertRowsInChunks(supabase, "erp_client_vehicles", normalizedVehicles, "num_placa")
    } catch (vehiclesUpsertError) {
      throw new Error("client_vehicles_upsert_failed", { cause: vehiclesUpsertError })
    }
  }

  const syncedVehicleCount = normalizedVehicles.length
  normalizedVehicles.length = 0

  const totalFailed = failedClientCount + failedVehicleCount
  const hasFailures = totalFailed > 0
  const hasSuccessfulUpserts = syncedClientCount > 0 || syncedVehicleCount > 0

  const status: SyncStatus = !hasFailures
    ? "success"
    : hasSuccessfulUpserts
      ? "warning"
      : "failed"

  const finishedAtDate = new Date()
  const finishedAt = finishedAtDate.toISOString()
  const durationSeconds = Math.max(
    0,
    Math.floor((finishedAtDate.getTime() - new Date(startedAt).getTime()) / 1000)
  )

  const isFinalVehiclePartition = Boolean(
    vehicleCursor && vehiclePartition === vehicleCursor.partitionCount - 1
  )
  let nextConsecutiveFailures = state.consecutive_failures

  if (status === "failed") {
    nextConsecutiveFailures = await saveSyncState(mode, status, startedAt)
  } else if (isFinalVehiclePartition && vehicleCursor) {
    nextConsecutiveFailures = 0
  }

  const message =
    status === "success"
      ? "Sincronização concluída com sucesso."
      : status === "warning"
        ? "Sincronização concluída com inconsistências em parte dos registros."
        : "Sincronização falhou."

  const { data: run, error: runError } = await supabase
    .from("client_sync_runs")
    .insert({
      mode,
      trigger,
      status,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_seconds: durationSeconds,
      message,
      counters_clients_received: clientsReceived,
      counters_clients_created: clientCounters.created,
      counters_clients_updated: clientCounters.updated,
      counters_clients_unchanged: clientCounters.unchanged,
      counters_clients_failed: failedClientCount,
      counters_clients_rejected: skippedInactiveClients,
      counters_vehicles_received: vehiclesReceived,
      counters_vehicles_created: vehicleCounters.created,
      counters_vehicles_updated: vehicleCounters.updated,
      counters_vehicles_unchanged: vehicleCounters.unchanged,
      counters_vehicles_failed: failedVehicleCount,
      counters_vehicles_rejected: skippedInactiveVehicles,
      consecutive_failures: nextConsecutiveFailures,
      source: "hubapi",
      requested_by: requestedBy,
      error_details: failedItems,
      metadata: {
        collapsedDuplicateVehicles,
        failureDetailsTruncated: totalFailed > failedItems.length,
        partitionCount: scope === "vehicles" ? partitionCount : null,
        partitionIndex: scope === "vehicles" ? vehiclePartition : null,
        scope,
        source: "hubapi",
        vehiclesSourceTotal,
      },
    })
    .select("id")
    .single()

  if (runError) {
    throw new Error("client_sync_run_insert_failed", { cause: runError })
  }

  await writeAuditEvent({
    actor: requestedBy ? "usuario" : "sistema",
    actorUserId: requestedBy ?? undefined,
    event: "client_synced",
    scope: "system",
    severity: status === "failed" ? "critical" : status === "warning" ? "warning" : "info",
    success: status !== "failed",
    target: "client_sync",
    metadata: {
      mode,
      scope,
      trigger,
      status,
      runId: run?.id,
      clientsReceived,
      clientsCreated: clientCounters.created,
      clientsUpdated: clientCounters.updated,
      clientsUnchanged: clientCounters.unchanged,
      clientsSkippedInactive: skippedInactiveClients,
      vehiclesReceived,
      vehiclesCreated: vehicleCounters.created,
      vehiclesUpdated: vehicleCounters.updated,
      vehiclesUnchanged: vehicleCounters.unchanged,
      vehiclesSkippedInactive: skippedInactiveVehicles,
      collapsedDuplicateVehicles,
      failed: totalFailed,
      partitionCount: scope === "vehicles" ? partitionCount : null,
      partitionIndex: scope === "vehicles" ? vehiclePartition : null,
      vehiclesSourceTotal,
    },
  }).catch((e) => console.error("[audit-fail]", e))

  if (status !== "failed" && isFinalVehiclePartition && vehicleCursor) {
    await saveSyncState(mode, status, vehicleCursor.batchStartedAt, true)
  }

  if (status !== "failed" && scope === "clients") {
    await saveSyncCursor({
      batchStartedAt: startedAt,
      checkpoint: state.last_successful_sync_at,
      kind: "vehicle_partitions",
      mode,
      nextPartition: 0,
      partitionCount: DEFAULT_VEHICLE_PARTITION_COUNT,
      requestedBy,
      trigger,
      version: 1,
    })
  } else if (
    status !== "failed" &&
    scope === "vehicles" &&
    vehicleCursor &&
    !isFinalVehiclePartition
  ) {
    await saveSyncCursor({
      ...vehicleCursor,
      nextPartition: vehiclePartition + 1,
    })
  }

  return {
    runId: String(run?.id ?? ""),
    status,
    message,
  }
}

async function registerFailedSyncRun(
  mode: SyncMode,
  scope: SyncScope,
  partitionIndex: number | null,
  trigger: SyncTrigger,
  requestedBy: string | null,
  reason: string
) {
  try {
    const supabase = createAdminClient()
    const startedAt = new Date().toISOString()
    const nextConsecutiveFailures = await saveSyncState(mode, "failed", startedAt)

    const { data: run } = await supabase
      .from("client_sync_runs")
      .insert({
        mode,
        trigger,
        status: "failed",
        started_at: startedAt,
        finished_at: startedAt,
        duration_seconds: 0,
        message: "Sincronização falhou.",
        counters_clients_received: 0,
        counters_clients_created: 0,
        counters_clients_updated: 0,
        counters_clients_unchanged: 0,
        counters_clients_failed: scope === "vehicles" ? 0 : 1,
        counters_vehicles_received: 0,
        counters_vehicles_created: 0,
        counters_vehicles_updated: 0,
        counters_vehicles_unchanged: 0,
        counters_vehicles_failed: scope === "clients" ? 0 : 1,
        consecutive_failures: nextConsecutiveFailures,
        source: "hubapi",
        requested_by: requestedBy,
        error_details: [
          {
            reason,
          },
        ],
        metadata: {
          source: "hubapi",
          registeredBy: "catch_handler",
          partitionIndex,
          scope,
        },
      })
      .select("id")
      .maybeSingle()

    await writeAuditEvent({
      actor: requestedBy ? "usuario" : "sistema",
      actorUserId: requestedBy ?? undefined,
      event: "client_synced",
      scope: "system",
      severity: "critical",
      success: false,
      target: "client_sync",
      reason,
      metadata: {
        mode,
        partitionIndex,
        scope,
        trigger,
        status: "failed",
        runId: run?.id,
      },
    }).catch((e) => console.error("[audit-fail]", e))
  } catch (failedRunError) {
    console.error("[clients-sync:register-failed-run-error]", failedRunError)
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req)

  if (cors) {
    return cors
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: getCorsHeaders(req),
    })
  }

  let mode: SyncMode = "incremental"
  let scope: SyncScope = "clients"
  let requestedPartition: number | null = null
  let requestedTrigger: SyncTrigger = "manual"
  let trigger: SyncTrigger = "manual"
  let requestedBy: string | null = null
  let lockAcquired = false

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    mode = resolveSyncMode(body.mode)
    scope = resolveSyncScope(body.scope)
    requestedPartition = resolveRequestedPartition(body.partitionIndex)
    requestedTrigger = resolveSyncTrigger(body.trigger)
    const actor = await getAuthenticatedActor(req)

    trigger = requestedTrigger

    if (actor) {
      const adminActor = await requirePermissionActor(actor, "sync.execute")
      requestedBy = adminActor.authUserId
      trigger = "manual"
    } else {
      const syncSecret = req.headers.get("x-sync-secret")
      const expectedSyncSecret = requireEnv("CLIENTS_SYNC_SECRET")

      if (!syncSecret || syncSecret !== expectedSyncSecret) {
        return jsonResponse({ message: "Unauthorized" }, 401, req)
      }

      trigger = "automatic"
    }

    lockAcquired = await tryAcquireSyncLock(
      mode,
      scope,
      requestedPartition,
      trigger,
      requestedBy
    )

    if (!lockAcquired) {
      return jsonResponse(
        {
          runId: null,
          status: "warning",
          message: "Já existe uma sincronização em andamento.",
        },
        200,
        req
      )
    }

    const result = await runSync(
      mode,
      scope,
      requestedPartition,
      trigger,
      requestedBy
    )

    return jsonResponse(result, 200, req)
  } catch (caughtError) {
    console.error("[clients-sync:error]", caughtError)

    const message =
      caughtError instanceof Error
        ? caughtError.message.slice(0, 500)
        : "unknown_error"

    if (message === "Unauthorized" || message === "Forbidden") {
      return jsonResponse(
        { message: "Você não tem permissão para executar esta sincronização." },
        message === "Unauthorized" ? 401 : 403,
        req
      )
    }

    await registerFailedSyncRun(
      mode,
      scope,
      requestedPartition,
      trigger || requestedTrigger,
      requestedBy,
      message
    )

    const errorResponse = resolveSyncErrorResponse(message)

    return jsonResponse(
      {
        message: errorResponse.message,
      },
      errorResponse.status,
      req
    )
  } finally {
    if (lockAcquired) {
      await releaseSyncLock()
    }
  }
})
