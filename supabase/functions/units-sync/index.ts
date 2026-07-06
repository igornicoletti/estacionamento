import {
  createAdminClient,
  getAuthenticatedActor,
  getCorsHeaders,
  handleCors,
  jsonResponse,
  requireAdminActor,
  writeAuditEvent,
} from "../_shared/index.ts"

type SyncMode = "full" | "incremental"
type SyncTrigger = "automatic" | "manual"
type SyncStatus = "success" | "warning" | "failed"

interface NormalizedUnitRow {
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
  source_hash: string
  source_updated_at: string | null
  synced_at: string
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

function resolveSyncMode(value: unknown): SyncMode {
  return value === "full" ? "full" : "incremental"
}

function resolveSyncTrigger(value: unknown): SyncTrigger {
  return value === "automatic" ? "automatic" : "manual"
}

function coerceUnitsPayload(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
  }

  if (raw && typeof raw === "object") {
    const candidate = raw as Record<string, unknown>

    for (const key of ["data", "items", "results", "unidades"]) {
      if (Array.isArray(candidate[key])) {
        return candidate[key] as unknown[]
      }
    }
  }

  return [] as unknown[]
}

async function buildSourceHash(row: Omit<NormalizedUnitRow, "source_hash" | "synced_at">) {
  const raw = [
    row.cod_empresa,
    row.nom_razao_social,
    row.nom_fantasia,
    row.num_cnpj,
    row.cod_bandeira,
    row.des_bandeira,
    row.cod_cidade,
    row.nom_cidade,
    row.nom_estado,
    row.sgl_estado,
    row.des_coordenada_empresa,
    row.ip_rede,
    row.nom_banco_dados,
    row.source_updated_at ?? "",
  ].join("|")

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function normalizeUnit(raw: unknown): Promise<NormalizedUnitRow | null> {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const candidate = raw as Record<string, unknown>
  const codEmpresa = normalizeNumber(candidate.cod_empresa)
  const codBandeira = normalizeNumber(candidate.cod_bandeira)
  const codCidade = normalizeNumber(candidate.cod_cidade)

  if (codEmpresa === null || codBandeira === null || codCidade === null) {
    return null
  }

  const normalizedBase = {
    cod_empresa: codEmpresa,
    nom_razao_social: normalizeText(candidate.nom_razao_social),
    nom_fantasia: normalizeText(candidate.nom_fantasia),
    num_cnpj: normalizeText(candidate.num_cnpj),
    cod_bandeira: codBandeira,
    des_bandeira: normalizeText(candidate.des_bandeira),
    cod_cidade: codCidade,
    nom_cidade: normalizeText(candidate.nom_cidade),
    nom_estado: normalizeText(candidate.nom_estado),
    sgl_estado: normalizeText(candidate.sgl_estado).toUpperCase(),
    des_coordenada_empresa: normalizeText(candidate.des_coordenada_empresa),
    ip_rede: normalizeText(candidate.ip_rede),
    nom_banco_dados: normalizeText(candidate.nom_banco_dados),
    source_updated_at:
      typeof candidate.updated_at === "string" && candidate.updated_at.trim().length > 0
        ? candidate.updated_at
        : null,
  }

  if (!normalizedBase.nom_fantasia || !normalizedBase.nom_razao_social) {
    return null
  }

  return {
    ...normalizedBase,
    source_hash: await buildSourceHash(normalizedBase),
    synced_at: new Date().toISOString(),
  }
}

async function fetchErpUnits(mode: SyncMode, lastSuccessfulSyncAt: string | null) {
  const baseUrl = requireEnv("ERP_BASE_URL")
  const endpoint = Deno.env.get("ERP_UNITS_ENDPOINT") || "/units"
  const updatedSinceParam = Deno.env.get("ERP_UNITS_UPDATED_SINCE_PARAM") || "updated_since"
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
  const timeoutMs = Number(Deno.env.get("ERP_REQUEST_TIMEOUT_MS") || "30000")

  const url = new URL(endpoint, baseUrl)

  if (mode === "incremental" && lastSuccessfulSyncAt) {
    url.searchParams.set(updatedSinceParam, lastSuccessfulSyncAt)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
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

    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      const bodyPreview = (await response.text()).slice(0, 300)
      throw new Error(`ERP request failed (${response.status}): ${bodyPreview}`)
    }

    const data = await response.json()

    return coerceUnitsPayload(data)
  } finally {
    clearTimeout(timeout)
  }
}

async function getSyncState() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("unit_sync_state")
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

async function saveSyncState(mode: SyncMode, status: SyncStatus, startedAt: string) {
  const supabase = createAdminClient()
  const success = status === "success" || status === "warning"

  const { data: current } = await supabase
    .from("unit_sync_state")
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

  if (mode === "full") {
    payload.last_full_sync_at = startedAt
  } else {
    payload.last_incremental_sync_at = startedAt
  }

  if (success) {
    payload.last_successful_sync_at = startedAt
  }

  await supabase.from("unit_sync_state").upsert(payload, { onConflict: "singleton_key" })

  return nextConsecutiveFailures
}

async function runSync(mode: SyncMode, trigger: SyncTrigger, requestedBy: string | null) {
  const supabase = createAdminClient()
  const startedAt = new Date().toISOString()
  const state = await getSyncState()

  const rawItems = await fetchErpUnits(mode, state.last_successful_sync_at)

  const normalized: NormalizedUnitRow[] = []
  const failedItems: Array<Record<string, unknown>> = []

  for (const [index, item] of rawItems.entries()) {
    const normalizedItem = await normalizeUnit(item)

    if (!normalizedItem) {
      failedItems.push({
        index,
        reason: "invalid_payload",
      })
      continue
    }

    normalized.push(normalizedItem)
  }

  const unitIds = normalized.map((item) => item.cod_empresa)
  const { data: existingRows } = unitIds.length
    ? await supabase
      .from("erp_units")
      .select("cod_empresa, source_hash")
      .in("cod_empresa", unitIds)
    : { data: [] as Array<{ cod_empresa: number; source_hash: string }> }

  const existingHashById = new Map(
    (existingRows ?? []).map((row) => [Number(row.cod_empresa), String(row.source_hash)])
  )

  let created = 0
  let updated = 0
  let unchanged = 0

  for (const item of normalized) {
    const previousHash = existingHashById.get(item.cod_empresa)

    if (!previousHash) {
      created += 1
      continue
    }

    if (previousHash === item.source_hash) {
      unchanged += 1
    } else {
      updated += 1
    }
  }

  if (normalized.length > 0) {
    const { error: upsertError } = await supabase
      .from("erp_units")
      .upsert(normalized, { onConflict: "cod_empresa" })

    if (upsertError) {
      throw new Error(upsertError.message)
    }
  }

  const status: SyncStatus =
    failedItems.length === 0
      ? "success"
      : normalized.length > 0
        ? "warning"
        : "failed"

  const finishedAtDate = new Date()
  const finishedAt = finishedAtDate.toISOString()
  const durationSeconds = Math.max(
    0,
    Math.floor((finishedAtDate.getTime() - new Date(startedAt).getTime()) / 1000)
  )

  const nextConsecutiveFailures = await saveSyncState(mode, status, startedAt)

  const message =
    status === "success"
      ? "Sincronização concluída com sucesso."
      : status === "warning"
        ? "Sincronização concluída com inconsistências em parte dos registros."
        : "Sincronização falhou."

  const runInsert = {
    mode,
    trigger,
    status,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_seconds: durationSeconds,
    message,
    counters_received: rawItems.length,
    counters_created: created,
    counters_updated: updated,
    counters_unchanged: unchanged,
    counters_failed: failedItems.length,
    consecutive_failures: nextConsecutiveFailures,
    requested_by: requestedBy,
    error_details: failedItems,
    metadata: {
      source: "hubapi",
    },
  }

  const { data: run, error: runError } = await supabase
    .from("unit_sync_runs")
    .insert(runInsert)
    .select("id")
    .single()

  if (runError) {
    throw new Error(runError.message)
  }

  await writeAuditEvent({
    actor: requestedBy ? "usuario" : "sistema",
    actorUserId: requestedBy ?? undefined,
    event: "unit.synced",
    scope: "system",
    severity: status === "failed" ? "critical" : status === "warning" ? "warning" : "info",
    success: status !== "failed",
    target: "unit_sync",
    metadata: {
      mode,
      trigger,
      status,
      runId: run?.id,
      received: rawItems.length,
      created,
      updated,
      unchanged,
      failed: failedItems.length,
    },
  })

  return {
    runId: String(run?.id ?? ""),
    status,
    message,
  }
}

async function registerFailedSyncRun(
  mode: SyncMode,
  trigger: SyncTrigger,
  requestedBy: string | null,
  reason: string
) {
  try {
    const supabase = createAdminClient()
    const startedAt = new Date().toISOString()
    const nextConsecutiveFailures = await saveSyncState(mode, "failed", startedAt)

    const { data: run } = await supabase
      .from("unit_sync_runs")
      .insert({
        mode,
        trigger,
        status: "failed",
        started_at: startedAt,
        finished_at: startedAt,
        duration_seconds: 0,
        message: "Sincronização falhou.",
        counters_received: 0,
        counters_created: 0,
        counters_updated: 0,
        counters_unchanged: 0,
        counters_failed: 1,
        consecutive_failures: nextConsecutiveFailures,
        requested_by: requestedBy,
        error_details: [
          {
            reason,
          },
        ],
        metadata: {
          source: "hubapi",
          registeredBy: "catch_handler",
        },
      })
      .select("id")
      .maybeSingle()

    await writeAuditEvent({
      actor: requestedBy ? "usuario" : "sistema",
      actorUserId: requestedBy ?? undefined,
      event: "unit.synced",
      scope: "system",
      severity: "critical",
      success: false,
      target: "unit_sync",
      reason,
      metadata: {
        mode,
        trigger,
        status: "failed",
        runId: run?.id,
      },
    })
  } catch (failedRunError) {
    console.error("[units-sync:register-failed-run-error]", failedRunError)
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
  let requestedTrigger: SyncTrigger = "manual"
  let trigger: SyncTrigger = "manual"
  let requestedBy: string | null = null

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    mode = resolveSyncMode(body.mode)
    requestedTrigger = resolveSyncTrigger(body.trigger)
    const actor = await getAuthenticatedActor(req)

    trigger = requestedTrigger

    if (actor) {
      const adminActor = requireAdminActor(actor)
      requestedBy = adminActor.authUserId
      trigger = "manual"
    } else {
      const syncSecret = req.headers.get("x-sync-secret")
      const expectedSyncSecret = requireEnv("UNITS_SYNC_SECRET")

      if (!syncSecret || syncSecret !== expectedSyncSecret) {
        return jsonResponse({ message: "Unauthorized" }, 401, req)
      }

      trigger = "automatic"
    }

    const result = await runSync(mode, trigger, requestedBy)

    return jsonResponse(result, 200, req)
  } catch (caughtError) {
    console.error("[units-sync:error]", caughtError)

    const message =
      caughtError instanceof Error
        ? caughtError.message.slice(0, 500)
        : "unknown_error"

    await registerFailedSyncRun(mode, trigger || requestedTrigger, requestedBy, message)

    return jsonResponse(
      {
        message: "Não foi possível sincronizar as unidades agora.",
      },
      500,
      req
    )
  }
})
