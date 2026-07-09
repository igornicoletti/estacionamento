import { type Client, type ClientVehicle } from "@/features/clients"
import { getSupabaseBrowserClient } from "@/lib"

import {
  type ToggleClientVipInput,
  type ToggleVehicleVipInput,
  type VipRule,
} from "../types/vip-rules-types"

const STORAGE_KEY = "rmc.vip-rules.v2"
const LEGACY_STORAGE_KEY = "rmc.vip-rules.v1"

interface RawCommercialRuleRow {
  id: string
  target_type: "client" | "vehicle" | "network" | "unit"
  client_id: number | null
  client_name: string | null
  vehicle_id: number | null
  vehicle_plate: string | null
  applies_to_all_vehicles: boolean | null
  vehicle_ids: number[] | null
  applies_to_all_units: boolean | null
  unit_ids: string[] | null
  status: "active" | "inactive"
  updated_at: string
}

export interface VipRulesGateway {
  listVipRules(): Promise<VipRule[]>
  saveVipRule(rule: VipRule): Promise<VipRule>
}

let configuredGateway: VipRulesGateway | null = null

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function sanitizeText(value: unknown) {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ")
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return ""
}

function sanitizeInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim())

    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
  }

  return 0
}

function sanitizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value.map(sanitizeText).filter((item) => item.length > 0)
}

function sanitizeNumberList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as number[]
  }

  return value
    .map(sanitizeInteger)
    .filter((item) => Number.isFinite(item) && item > 0)
}

function createClientRuleId(clientId: number) {
  return `vip-client:${clientId}`
}

function createVehicleRuleId(clientId: number, vehicleId: number) {
  return `vip-vehicle:${clientId}:${vehicleId}`
}

function getStableRuleId(rule: Pick<VipRule, "targetType" | "clientId" | "vehicleId">) {
  if (rule.targetType === "client") {
    return createClientRuleId(rule.clientId)
  }

  return createVehicleRuleId(rule.clientId, rule.vehicleId ?? 0)
}

function getRuleNaturalKey(rule: Pick<VipRule, "targetType" | "clientId" | "vehicleId">) {
  return getStableRuleId(rule)
}

function sortRulesByUpdatedAt(rules: readonly VipRule[]) {
  return [...rules].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt)
  )
}

function normalizeRuleIdentity(rule: VipRule): VipRule {
  return {
    ...rule,
    id: getStableRuleId(rule),
  }
}

function normalizeVipRules(rules: readonly VipRule[]) {
  const byNaturalKey = new Map<string, VipRule>()

  for (const rule of sortRulesByUpdatedAt(rules).reverse()) {
    byNaturalKey.set(getRuleNaturalKey(rule), normalizeRuleIdentity(rule))
  }

  return sortRulesByUpdatedAt([...byNaturalKey.values()])
}

function sanitizeVipRule(value: unknown): VipRule | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<VipRule>
  const targetType = candidate.targetType === "vehicle" ? "vehicle" : candidate.targetType === "client" ? "client" : null
  const clientId = sanitizeInteger(candidate.clientId)
  const clientName = sanitizeText(candidate.clientName)
  const updatedAt = sanitizeText(candidate.updatedAt) || new Date(0).toISOString()
  const vehicleId = candidate.vehicleId === null || candidate.vehicleId === undefined
    ? null
    : sanitizeInteger(candidate.vehicleId) || null

  if (!targetType || clientId <= 0 || !clientName) {
    return null
  }

  if (targetType === "vehicle" && (!vehicleId || vehicleId <= 0)) {
    return null
  }

  return normalizeRuleIdentity({
    id: "",
    targetType,
    clientId,
    clientName,
    vehicleId,
    vehiclePlate: candidate.vehiclePlate === null || candidate.vehiclePlate === undefined ? null : sanitizeText(candidate.vehiclePlate) || null,
    appliesToAllVehicles: targetType === "client" ? Boolean(candidate.appliesToAllVehicles) : false,
    vehicleIds: targetType === "client" ? sanitizeNumberList(candidate.vehicleIds) : vehicleId ? [vehicleId] : [],
    appliesToAllUnits: Boolean(candidate.appliesToAllUnits),
    unitIds: sanitizeStringList(candidate.unitIds),
    active: Boolean(candidate.active),
    updatedAt,
  })
}

function readStoredRulesFromKey(key: string) {
  if (!canUseStorage()) {
    return [] as VipRule[]
  }

  const raw = window.localStorage.getItem(key)

  if (!raw) {
    return [] as VipRule[]
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return [] as VipRule[]
    }

    return parsed
      .map(sanitizeVipRule)
      .filter((rule): rule is VipRule => Boolean(rule))
  } catch {
    return [] as VipRule[]
  }
}

function readStoredRules() {
  return normalizeVipRules([
    ...readStoredRulesFromKey(STORAGE_KEY),
    ...readStoredRulesFromKey(LEGACY_STORAGE_KEY),
  ])
}

function writeStoredRules(rules: readonly VipRule[]) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeVipRules(rules)))
  } catch {
    // Persistência local é apenas fallback; erros de quota não devem derrubar a UI.
  }
}

function assertPositiveId(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} inválido.`)
  }
}

function createLocalStorageVipRulesGateway(): VipRulesGateway {
  return {
    async listVipRules() {
      await Promise.resolve()
      return readStoredRules()
    },
    async saveVipRule(rule) {
      await Promise.resolve()
      const nextRule = normalizeRuleIdentity(rule)
      const nextRules = normalizeVipRules([
        nextRule,
        ...readStoredRules().filter((currentRule) =>
          getRuleNaturalKey(currentRule) !== getRuleNaturalKey(nextRule)
        ),
      ])

      writeStoredRules(nextRules)

      return nextRule
    },
  }
}

function mapCommercialRuleRow(row: RawCommercialRuleRow): VipRule | null {
  if (row.target_type !== "client" && row.target_type !== "vehicle") {
    return null
  }

  return sanitizeVipRule({
    targetType: row.target_type,
    clientId: row.client_id,
    clientName: row.client_name,
    vehicleId: row.vehicle_id,
    vehiclePlate: row.vehicle_plate,
    appliesToAllVehicles: row.applies_to_all_vehicles,
    vehicleIds: row.vehicle_ids,
    appliesToAllUnits: row.applies_to_all_units,
    unitIds: row.unit_ids,
    active: row.status === "active",
    updatedAt: row.updated_at,
  })
}

function createSupabaseVipRulesGateway(): VipRulesGateway {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return createLocalStorageVipRulesGateway()
  }

  return {
    async listVipRules() {
      const { data, error } = await supabase
        .from("commercial_rules")
        .select([
          "id",
          "target_type",
          "client_id",
          "client_name",
          "vehicle_id",
          "vehicle_plate",
          "applies_to_all_vehicles",
          "vehicle_ids",
          "applies_to_all_units",
          "unit_ids",
          "status",
          "updated_at",
        ].join(","))
        .eq("type", "vip")
        .order("updated_at", { ascending: false })

      if (error) {
        throw new Error("Não foi possível carregar as regras VIP.", {
          cause: error,
        })
      }

      return normalizeVipRules(
        ((data ?? []) as unknown as RawCommercialRuleRow[])
          .map(mapCommercialRuleRow)
          .filter((rule): rule is VipRule => Boolean(rule))
      )
    },
    async saveVipRule(rule) {
      const nextRule = normalizeRuleIdentity(rule)
      const { data, error } = await supabase
        .from("commercial_rules")
        .upsert({
          id: nextRule.id,
          type: "vip",
          target_type: nextRule.targetType,
          client_id: nextRule.clientId,
          client_name: nextRule.clientName,
          vehicle_id: nextRule.vehicleId,
          vehicle_plate: nextRule.vehiclePlate,
          applies_to_all_vehicles: nextRule.appliesToAllVehicles,
          vehicle_ids: nextRule.vehicleIds,
          applies_to_all_units: nextRule.appliesToAllUnits,
          unit_ids: nextRule.unitIds,
          status: nextRule.active ? "active" : "inactive",
          starts_at: nextRule.updatedAt,
        }, {
          onConflict: "id",
        })
        .select([
          "id",
          "target_type",
          "client_id",
          "client_name",
          "vehicle_id",
          "vehicle_plate",
          "applies_to_all_vehicles",
          "vehicle_ids",
          "applies_to_all_units",
          "unit_ids",
          "status",
          "updated_at",
        ].join(","))
        .single()

      if (error) {
        throw new Error("Não foi possível salvar a regra VIP.", {
          cause: error,
        })
      }

      return mapCommercialRuleRow(data as unknown as RawCommercialRuleRow) ?? nextRule
    },
  }
}

function shouldUseSupabaseVipRulesGateway() {
  return import.meta.env.MODE !== "test" && Boolean(getSupabaseBrowserClient())
}

function getVipRulesGateway() {
  if (configuredGateway) {
    return configuredGateway
  }

  return shouldUseSupabaseVipRulesGateway()
    ? createSupabaseVipRulesGateway()
    : createLocalStorageVipRulesGateway()
}

export function setVipRulesGateway(gateway: VipRulesGateway) {
  configuredGateway = gateway
}

export function resetVipRulesGateway() {
  configuredGateway = null
}

export function createMemoryVipRulesGateway(seedRules: readonly VipRule[] = []): VipRulesGateway {
  let rules = normalizeVipRules(seedRules)

  return {
    async listVipRules() {
      await Promise.resolve()
      return rules.map((rule) => ({ ...rule, vehicleIds: [...rule.vehicleIds], unitIds: [...rule.unitIds] }))
    },
    async saveVipRule(rule) {
      await Promise.resolve()
      const nextRule = normalizeRuleIdentity(rule)
      rules = normalizeVipRules([
        nextRule,
        ...rules.filter((currentRule) =>
          getRuleNaturalKey(currentRule) !== getRuleNaturalKey(nextRule)
        ),
      ])

      return nextRule
    },
  }
}

export async function listVipRules(): Promise<VipRule[]> {
  return getVipRulesGateway().listVipRules()
}

export async function toggleClientVip(input: ToggleClientVipInput): Promise<VipRule> {
  assertPositiveId(input.clientId, "Cliente")

  const now = new Date().toISOString()

  return getVipRulesGateway().saveVipRule({
    id: createClientRuleId(input.clientId),
    targetType: "client",
    clientId: input.clientId,
    clientName: input.clientName,
    vehicleId: null,
    vehiclePlate: null,
    appliesToAllVehicles: true,
    vehicleIds: [],
    appliesToAllUnits: true,
    unitIds: [],
    active: input.enabled,
    updatedAt: now,
  })
}

export async function toggleVehicleVip(input: ToggleVehicleVipInput): Promise<VipRule> {
  assertPositiveId(input.clientId, "Cliente")
  assertPositiveId(input.vehicleId, "Veículo")

  const now = new Date().toISOString()

  return getVipRulesGateway().saveVipRule({
    id: createVehicleRuleId(input.clientId, input.vehicleId),
    targetType: "vehicle",
    clientId: input.clientId,
    clientName: input.clientName,
    vehicleId: input.vehicleId,
    vehiclePlate: input.vehiclePlate,
    appliesToAllVehicles: false,
    vehicleIds: [input.vehicleId],
    appliesToAllUnits: true,
    unitIds: [],
    active: input.enabled,
    updatedAt: now,
  })
}

export function isClientVipFromRules(rules: readonly VipRule[], clientId: number) {
  return normalizeVipRules(rules).some((rule) => {
    return rule.active && rule.clientId === clientId && rule.targetType === "client"
  })
}

export function isVehicleVipFromRules(
  rules: readonly VipRule[],
  clientId: number,
  vehicleId: number
) {
  return normalizeVipRules(rules).some((rule) => {
    if (!rule.active || rule.clientId !== clientId) {
      return false
    }

    if (rule.targetType === "vehicle" && rule.vehicleId === vehicleId) {
      return true
    }

    if (rule.targetType === "client") {
      if (rule.appliesToAllVehicles) {
        return true
      }

      return rule.vehicleIds.includes(vehicleId)
    }

    return false
  })
}

export function getVipRuleScopeLabel(rule: VipRule) {
  if (!rule.active) {
    return "Inativa"
  }

  if (rule.appliesToAllUnits) {
    return rule.targetType === "client" && rule.appliesToAllVehicles
      ? "Todas as unidades e veículos"
      : "Todas as unidades"
  }

  if (rule.unitIds.length > 0) {
    return `${rule.unitIds.length} unidade(s)`
  }

  return "Sem unidades definidas"
}

export function getVipRuleVehicleScopeLabel(rule: VipRule) {
  if (rule.targetType === "vehicle") {
    return rule.vehiclePlate ?? "Placa específica"
  }

  if (rule.appliesToAllVehicles) {
    return "Todos os veículos"
  }

  if (rule.vehicleIds.length > 0) {
    return `${rule.vehicleIds.length} veículo(s)`
  }

  return "Sem veículos definidos"
}

export function getClientVipStatus(client: Client, rules: readonly VipRule[]) {
  return isClientVipFromRules(rules, client.cod_pessoa)
}

export function getVehicleVipStatus(
  vehicle: ClientVehicle,
  rules: readonly VipRule[]
) {
  return isVehicleVipFromRules(rules, vehicle.cod_pessoa, vehicle.cod_veiculo)
}
