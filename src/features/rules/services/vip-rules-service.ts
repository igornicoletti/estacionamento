import { type Client, type ClientVehicle } from "@/features/clients"
import { getSupabaseBrowserClient } from "@/lib"

import { rulesCopy } from "../rules-copy"
import {
  type SaveVipRuleInput,
  type ToggleClientVipInput,
  type ToggleVehicleVipInput,
  type VipRule,
} from "../types/vip-rules-types"
import {
  createVipClientRuleId,
  createVipVehicleRuleId,
  isClientVipFromRules,
  isVehicleVipFromRules,
} from "../utils/vip-rules-models"
import { parseVipRule, parseVipRules } from "../utils/vip-rules-parsers"

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(rulesCopy.feedback.loadError)
  }

  return supabase
}

function ensurePositiveInteger(value: number, message: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(message)
  }
}

function buildVipRulePayload(input: SaveVipRuleInput) {
  ensurePositiveInteger(input.clientId, rulesCopy.form.validation.clientId)

  if (input.clientName.trim().length === 0) {
    throw new Error(rulesCopy.form.validation.clientName)
  }

  if (input.reason.trim().length < 10) {
    throw new Error(rulesCopy.form.validation.reason)
  }

  if (input.targetType === "vehicle") {
    if (!input.vehicleId || input.vehicleId <= 0) {
      throw new Error(rulesCopy.form.validation.vehicleId)
    }

    if (!input.vehiclePlate || input.vehiclePlate.trim().length === 0) {
      throw new Error(rulesCopy.form.validation.vehiclePlate)
    }
  }

  return {
    id:
      input.targetType === "client"
        ? createVipClientRuleId(input.clientId)
        : createVipVehicleRuleId(input.clientId, input.vehicleId ?? 0),
    type: "vip",
    target_type: input.targetType,
    client_id: input.clientId,
    client_name: input.clientName.trim(),
    vehicle_id: input.targetType === "vehicle" ? input.vehicleId : null,
    vehicle_plate: input.targetType === "vehicle" ? input.vehiclePlate?.trim() ?? null : null,
    applies_to_all_vehicles: input.targetType === "client",
    vehicle_ids: input.targetType === "vehicle" && input.vehicleId ? [input.vehicleId] : [],
    applies_to_all_units: input.appliesToAllUnits,
    unit_ids: input.appliesToAllUnits ? [] : input.unitIds,
    status: input.active ? "active" : "inactive",
    starts_at: new Date().toISOString(),
    reason: input.reason.trim(),
    notes: input.notes?.trim() ? input.notes.trim() : null,
  }
}

const vipRuleSelect = [
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
  "reason",
  "notes",
  "updated_at",
].join(",")

export async function listVipRules(): Promise<VipRule[]> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from("commercial_rules")
    .select(vipRuleSelect)
    .eq("type", "vip")
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(rulesCopy.feedback.loadError, { cause: error })
  }

  return parseVipRules(data ?? [])
}

export async function saveVipRule(input: SaveVipRuleInput): Promise<VipRule> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from("commercial_rules")
    .upsert(buildVipRulePayload(input), { onConflict: "id" })
    .select(vipRuleSelect)
    .single()

  if (error) {
    throw new Error(rulesCopy.feedback.save.error, { cause: error })
  }

  const rule = parseVipRule(data)

  if (!rule) {
    throw new Error(rulesCopy.feedback.save.error)
  }

  return rule
}

export function getVipRuleScopeLabel(rule: VipRule) {
  if (!rule.active) {
    return rulesCopy.labels.inactive
  }

  if (rule.appliesToAllUnits) {
    return rule.targetType === "client" && rule.appliesToAllVehicles
      ? "Todas as unidades e veículos"
      : rulesCopy.labels.allUnits
  }

  if (rule.unitIds.length > 0) {
    return `${rule.unitIds.length} unidade(s)`
  }

  return rulesCopy.labels.notConfigured
}

export function getVipRuleVehicleScopeLabel(rule: VipRule) {
  if (rule.targetType === "vehicle") {
    return rule.vehiclePlate ?? rulesCopy.labels.specificVehicle
  }

  if (rule.appliesToAllVehicles) {
    return rulesCopy.labels.allVehicles
  }

  if (rule.vehicleIds.length > 0) {
    return `${rule.vehicleIds.length} veículo(s)`
  }

  return rulesCopy.labels.notConfigured
}

export async function toggleClientVip(input: ToggleClientVipInput): Promise<VipRule> {
  return saveVipRule({
    targetType: "client",
    clientId: input.clientId,
    clientName: input.clientName,
    vehicleId: null,
    vehiclePlate: null,
    appliesToAllUnits: true,
    unitIds: [],
    active: input.enabled,
    reason: input.enabled ? "Ativação administrativa de regra VIP." : "Inativação administrativa de regra VIP.",
    notes: null,
  })
}

export async function toggleVehicleVip(input: ToggleVehicleVipInput): Promise<VipRule> {
  return saveVipRule({
    targetType: "vehicle",
    clientId: input.clientId,
    clientName: input.clientName,
    vehicleId: input.vehicleId,
    vehiclePlate: input.vehiclePlate,
    appliesToAllUnits: true,
    unitIds: [],
    active: input.enabled,
    reason: input.enabled ? "Ativação administrativa de regra VIP." : "Inativação administrativa de regra VIP.",
    notes: null,
  })
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
