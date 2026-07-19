import { pricesCopy } from "../constants"
import {
  priceScopeValues,
  priceStatusValues,
  type PriceScope,
  type PriceStatus,
  type PriceTableFormValues,
  type SavePriceTablePayload,
} from "./prices-types"

export type PriceTableFormErrors = Partial<Record<keyof PriceTableFormValues, string>>

function isPriceScope(value: string): value is PriceScope {
  return priceScopeValues.includes(value as PriceScope)
}

function isPriceStatus(value: string): value is PriceStatus {
  return priceStatusValues.includes(value as PriceStatus)
}

function parseNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".")
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

function parseInteger(value: string) {
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

function toIso(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function createEmptyPriceTableFormValues(): PriceTableFormValues {
  const defaultStartsAt = new Date().toISOString().slice(0, 16)

  return {
    name: "Tabela padrão",
    scope: "global",
    unitId: "",
    unitName: "",
    graceMinutes: "0",
    toleranceMinutes: "0",
    cycleHours: "1",
    amount: "",
    startsAt: defaultStartsAt,
    endsAt: "",
    status: "active",
    notes: "",
  }
}

export function createPriceTableFormValues(record: Partial<PriceTableFormValues>): PriceTableFormValues {
  return { ...createEmptyPriceTableFormValues(), ...record }
}

export function validatePriceTableForm(values: PriceTableFormValues) {
  const errors: PriceTableFormErrors = {}
  const amount = parseNumber(values.amount)
  const graceMinutes = parseInteger(values.graceMinutes)
  const toleranceMinutes = parseInteger(values.toleranceMinutes)
  const cycleHours = parseInteger(values.cycleHours)
  const startsAt = toIso(values.startsAt)
  const endsAt = values.endsAt ? toIso(values.endsAt) : null

  if (!values.name.trim()) {
    errors.name = pricesCopy.validation.required
  }

  if (!isPriceScope(values.scope)) {
    errors.scope = pricesCopy.validation.required
  }

  if (values.scope === "unit" && !values.unitId.trim()) {
    errors.unitId = pricesCopy.validation.required
  }

  if (amount === null || amount <= 0) {
    errors.amount = pricesCopy.validation.positiveMoney
  }

  if (graceMinutes === null || graceMinutes < 0) {
    errors.graceMinutes = pricesCopy.validation.nonNegativeInteger
  }

  if (toleranceMinutes === null || toleranceMinutes < 0) {
    errors.toleranceMinutes = pricesCopy.validation.nonNegativeInteger
  }

  if (cycleHours === null || cycleHours <= 0) {
    errors.cycleHours = pricesCopy.validation.positiveInteger
  }

  if (!startsAt) {
    errors.startsAt = pricesCopy.validation.invalidDate
  }

  if (values.endsAt && !endsAt) {
    errors.endsAt = pricesCopy.validation.invalidDate
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    errors.endsAt = pricesCopy.validation.endBeforeStart
  }

  if (!isPriceStatus(values.status)) {
    errors.status = pricesCopy.validation.required
  }

  if (Object.keys(errors).length > 0 || amount === null || graceMinutes === null || toleranceMinutes === null || cycleHours === null || !startsAt || !isPriceScope(values.scope) || !isPriceStatus(values.status)) {
    return { success: false as const, errors }
  }

  const payload: SavePriceTablePayload = {
    id: values.id,
    name: values.name.trim(),
    scope: values.scope,
    unitId: values.scope === "unit" ? values.unitId.trim() : null,
    unitName: values.scope === "unit" ? values.unitName.trim() || null : null,
    graceMinutes,
    toleranceMinutes,
    cycleHours,
    amount,
    startsAt,
    endsAt,
    status: values.status,
    notes: values.notes.trim() || null,
  }

  return {
    success: true as const,
    data: payload,
    errors: {} as PriceTableFormErrors,
  }
}
