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
  formatVipRuleVehicleScope,
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

function ensurePositiveNumber(value: number, message: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(message)
  }
}

function normalizeUnitIds(unitIds: readonly string[]) {
  return Array.from(
    new Set(unitIds.map((unitId) => unitId.trim()).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right))
}

function normalizeVehicleIds(vehicleIds: readonly number[]) {
  return Array.from(
    new Set(
      vehicleIds
        .map((vehicleId) => Math.trunc(vehicleId))
        .filter((vehicleId) => Number.isFinite(vehicleId) && vehicleId > 0)
    )
  ).sort((left, right) => left - right)
}

function ensureUnitScope(unitIds: readonly string[]) {
  if (unitIds.length === 0) {
    throw new Error(rulesCopy.form.validation.unitIds)
  }
}

function validateRuleInput(input: SaveVipRuleInput) {
  if (input.reason.trim().length < 10) {
    throw new Error(rulesCopy.form.validation.reason)
  }

  if (input.ruleType === "vip") {
    ensurePositiveInteger(input.clientId, rulesCopy.form.validation.clientId)

    if (input.clientName.trim().length === 0) {
      throw new Error(rulesCopy.form.validation.clientName)
    }

    if (input.targetType === "vehicle") {
      if (!input.vehicleId || input.vehicleId <= 0) {
        throw new Error(rulesCopy.form.validation.vehicleId)
      }

      if (!input.vehiclePlate || input.vehiclePlate.trim().length === 0) {
        throw new Error(rulesCopy.form.validation.vehiclePlate)
      }
    }

    if (
      input.targetType === "client" &&
      !input.appliesToAllVehicles &&
      normalizeVehicleIds(input.vehicleIds).length === 0
    ) {
      throw new Error(rulesCopy.form.validation.vehicleIds)
    }
  }

  if (input.ruleType === "fuel_benefit") {
    ensurePositiveNumber(input.fuelMinLiters, rulesCopy.form.validation.fuelMinLiters)
    ensurePositiveNumber(input.benefitHours, rulesCopy.form.validation.benefitHours)

    if (input.scope === "unit") {
      ensureUnitScope(input.unitIds)
    }
  }

  if (input.ruleType === "yard_cleaning_occupancy") {
    ensureUnitScope(input.unitIds)
    ensurePositiveInteger(
      input.yardOccupancyThreshold,
      rulesCopy.form.validation.yardOccupancyThreshold
    )
  }

  if (input.ruleType === "yard_cleaning") {
    ensureUnitScope(input.unitIds)
    ensurePositiveInteger(
      input.yardOccupancyThreshold,
      rulesCopy.form.validation.yardOccupancyThreshold
    )
    ensurePositiveNumber(
      input.yardStaleVehicleHours,
      rulesCopy.form.validation.yardStaleVehicleHours
    )
  }

  if (input.ruleType === "yard_cleaning_stale_vehicle") {
    ensurePositiveNumber(
      input.yardStaleVehicleHours,
      rulesCopy.form.validation.yardStaleVehicleHours
    )

    if (input.scope === "unit") {
      ensureUnitScope(input.unitIds)
    }
  }
}

function buildCommercialRulePayload(input: SaveVipRuleInput) {
  validateRuleInput(input)

  if (input.ruleType === "vip") {
    return {
      p_active: input.active,
      p_applies_to_all_units: input.appliesToAllUnits,
      p_benefit_hours: null,
      p_client_id: input.clientId,
      p_client_name: input.clientName.trim(),
      p_fuel_min_liters: null,
      p_notes: input.notes?.trim() ? input.notes.trim() : null,
      p_reason: input.reason.trim(),
      p_target_type: input.targetType,
      p_type: input.ruleType,
      p_unit_ids: input.appliesToAllUnits ? [] : normalizeUnitIds(input.unitIds),
      p_vehicle_id: input.targetType === "vehicle" ? input.vehicleId : null,
      p_vehicle_ids: input.targetType === "client" && !input.appliesToAllVehicles
        ? normalizeVehicleIds(input.vehicleIds)
        : [],
      p_vehicle_plate: input.targetType === "vehicle" ? input.vehiclePlate?.trim() ?? null : null,
      p_yard_occupancy_threshold: null,
      p_yard_stale_vehicle_hours: null,
    }
  }

  if (input.ruleType === "fuel_benefit") {
    return {
      p_active: input.active,
      p_applies_to_all_units: input.scope === "network",
      p_benefit_hours: input.benefitHours,
      p_client_id: null,
      p_client_name: null,
      p_fuel_min_liters: input.fuelMinLiters,
      p_notes: input.notes?.trim() ? input.notes.trim() : null,
      p_reason: input.reason.trim(),
      p_target_type: input.scope,
      p_type: input.ruleType,
      p_unit_ids: input.scope === "network" ? [] : normalizeUnitIds(input.unitIds),
      p_vehicle_id: null,
      p_vehicle_ids: [],
      p_vehicle_plate: null,
      p_yard_occupancy_threshold: null,
      p_yard_stale_vehicle_hours: null,
    }
  }

  if (input.ruleType === "yard_cleaning") {
    return {
      p_active: input.active,
      p_applies_to_all_units: false,
      p_benefit_hours: null,
      p_client_id: null,
      p_client_name: null,
      p_fuel_min_liters: null,
      p_notes: input.notes?.trim() ? input.notes.trim() : null,
      p_reason: input.reason.trim(),
      p_target_type: "unit",
      p_type: input.ruleType,
      p_unit_ids: normalizeUnitIds(input.unitIds),
      p_vehicle_id: null,
      p_vehicle_ids: [],
      p_vehicle_plate: null,
      p_yard_occupancy_threshold: input.yardOccupancyThreshold,
      p_yard_stale_vehicle_hours: input.yardStaleVehicleHours,
    }
  }

  if (input.ruleType === "yard_cleaning_occupancy") {
    return {
      p_active: input.active,
      p_applies_to_all_units: false,
      p_benefit_hours: null,
      p_client_id: null,
      p_client_name: null,
      p_fuel_min_liters: null,
      p_notes: input.notes?.trim() ? input.notes.trim() : null,
      p_reason: input.reason.trim(),
      p_target_type: "unit",
      p_type: input.ruleType,
      p_unit_ids: normalizeUnitIds(input.unitIds),
      p_vehicle_id: null,
      p_vehicle_ids: [],
      p_vehicle_plate: null,
      p_yard_occupancy_threshold: input.yardOccupancyThreshold,
      p_yard_stale_vehicle_hours: null,
    }
  }

  return {
    p_active: input.active,
    p_applies_to_all_units: input.scope === "network",
    p_benefit_hours: null,
    p_client_id: null,
    p_client_name: null,
    p_fuel_min_liters: null,
    p_notes: input.notes?.trim() ? input.notes.trim() : null,
    p_reason: input.reason.trim(),
    p_target_type: input.scope,
    p_type: input.ruleType,
    p_unit_ids: input.scope === "network" ? [] : normalizeUnitIds(input.unitIds),
    p_vehicle_id: null,
    p_vehicle_ids: [],
    p_vehicle_plate: null,
    p_yard_occupancy_threshold: null,
    p_yard_stale_vehicle_hours: input.yardStaleVehicleHours,
  }
}

async function getRuleById(id: string): Promise<VipRule> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from("commercial_rules")
    .select(commercialRuleSelect)
    .eq("id", id)
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

const commercialRuleSelect = [
  "id",
  "type",
  "target_type",
  "client_id",
  "client_name",
  "vehicle_id",
  "vehicle_plate",
  "applies_to_all_vehicles",
  "vehicle_ids",
  "applies_to_all_units",
  "unit_ids",
  "fuel_min_liters",
  "benefit_hours",
  "yard_occupancy_threshold",
  "yard_stale_vehicle_hours",
  "status",
  "reason",
  "notes",
  "updated_at",
].join(",")

export async function listVipRules(): Promise<VipRule[]> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from("commercial_rules")
    .select(commercialRuleSelect)
    .is("ends_at", null)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(rulesCopy.feedback.loadError, { cause: error })
  }

  return parseVipRules(data ?? [])
}

export async function saveVipRule(input: SaveVipRuleInput): Promise<VipRule> {
  const supabase = getSupabaseOrThrow()
  const payload = buildCommercialRulePayload(input)
  const response = await supabase.rpc("save_commercial_rule_version", payload) as {
    data: unknown
    error: unknown
  }
  const { data, error } = response

  if (error || typeof data !== "string") {
    throw new Error(rulesCopy.feedback.save.error, { cause: error })
  }

  return getRuleById(data)
}

export function getVipRuleScopeLabel(rule: VipRule) {
  return rule.scopeLabel
}

export function getVipRuleVehicleScopeLabel(rule: VipRule) {
  return formatVipRuleVehicleScope(rule)
}

export async function toggleClientVip(input: ToggleClientVipInput): Promise<VipRule> {
  return saveVipRule({
    ruleType: "vip",
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
    reason: input.enabled ? "Ativação administrativa de regra VIP." : "Inativação administrativa de regra VIP.",
    notes: null,
  })
}

export async function toggleVehicleVip(input: ToggleVehicleVipInput): Promise<VipRule> {
  return saveVipRule({
    ruleType: "vip",
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
