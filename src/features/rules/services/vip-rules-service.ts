import { type Client, type ClientVehicle } from "@/features/clients"

import {
  type ToggleClientVipInput,
  type ToggleVehicleVipInput,
  type VipRule,
} from "../types/vip-rules-types"

const STORAGE_KEY = "rmc.vip-rules.v1"

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

function sanitizeVipRule(value: unknown): VipRule | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<VipRule>
  const id = sanitizeText(candidate.id)
  const targetType = candidate.targetType === "vehicle" ? "vehicle" : candidate.targetType === "client" ? "client" : null
  const clientId = sanitizeInteger(candidate.clientId)
  const clientName = sanitizeText(candidate.clientName)
  const updatedAt = sanitizeText(candidate.updatedAt) || new Date(0).toISOString()

  if (!id || !targetType || clientId <= 0 || !clientName) {
    return null
  }

  return {
    id,
    targetType,
    clientId,
    clientName,
    vehicleId: candidate.vehicleId === null || candidate.vehicleId === undefined ? null : sanitizeInteger(candidate.vehicleId) || null,
    vehiclePlate: candidate.vehiclePlate === null || candidate.vehiclePlate === undefined ? null : sanitizeText(candidate.vehiclePlate) || null,
    appliesToAllVehicles: Boolean(candidate.appliesToAllVehicles),
    vehicleIds: sanitizeNumberList(candidate.vehicleIds),
    appliesToAllUnits: Boolean(candidate.appliesToAllUnits),
    unitIds: sanitizeStringList(candidate.unitIds),
    active: Boolean(candidate.active),
    updatedAt,
  }
}

function readStoredRules() {
  if (!canUseStorage()) {
    return [] as VipRule[]
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

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

function writeStoredRules(rules: readonly VipRule[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

function createRuleId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

function upsertRule(nextRule: VipRule) {
  const currentRules = readStoredRules().filter((rule) => rule.id !== nextRule.id)
  const nextRules = [nextRule, ...currentRules].sort((first, second) => {
    return second.updatedAt.localeCompare(first.updatedAt)
  })

  writeStoredRules(nextRules)
  return nextRule
}

export async function listVipRules(): Promise<VipRule[]> {
  await Promise.resolve()

  return readStoredRules()
}

export async function toggleClientVip(input: ToggleClientVipInput): Promise<VipRule> {
  await Promise.resolve()

  const rule = upsertRule({
    id: createRuleId("vip-client"),
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
    updatedAt: new Date().toISOString(),
  })

  return rule
}

export async function toggleVehicleVip(input: ToggleVehicleVipInput): Promise<VipRule> {
  await Promise.resolve()

  const rule = upsertRule({
    id: createRuleId("vip-vehicle"),
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
    updatedAt: new Date().toISOString(),
  })

  return rule
}

export function isClientVipFromRules(rules: readonly VipRule[], clientId: number) {
  return rules.some((rule) => {
    if (!rule.active || rule.clientId !== clientId) {
      return false
    }

    return rule.targetType === "client" || rule.targetType === "vehicle"
  })
}

export function isVehicleVipFromRules(
  rules: readonly VipRule[],
  clientId: number,
  vehicleId: number
) {
  return rules.some((rule) => {
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
      : rule.targetType === "vehicle"
        ? "Todas as unidades"
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
