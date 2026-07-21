import { z } from "zod"

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

const priceTableValidationSchema = z
  .object({
    id: z.string().optional(),
    amount: z.number({ error: pricesCopy.validation.positiveMoney }).positive({ error: pricesCopy.validation.positiveMoney }),
    cycleHours: z.number({ error: pricesCopy.validation.positiveInteger }).int({ error: pricesCopy.validation.positiveInteger }).positive({ error: pricesCopy.validation.positiveInteger }),
    endsAt: z.string({ error: pricesCopy.validation.invalidDate }).min(1, { error: pricesCopy.validation.invalidDate }).nullable(),
    graceMinutes: z.number({ error: pricesCopy.validation.nonNegativeInteger }).int({ error: pricesCopy.validation.nonNegativeInteger }).min(0, { error: pricesCopy.validation.nonNegativeInteger }),
    name: z.string({ error: pricesCopy.validation.required }).trim().min(1, { error: pricesCopy.validation.required }),
    notes: z.string(),
    scope: z.string({ error: pricesCopy.validation.required }).refine(isPriceScope, { error: pricesCopy.validation.required }),
    startsAt: z.string({ error: pricesCopy.validation.invalidDate }).min(1, { error: pricesCopy.validation.invalidDate }),
    status: z.string({ error: pricesCopy.validation.required }).refine(isPriceStatus, { error: pricesCopy.validation.required }),
    toleranceMinutes: z.number({ error: pricesCopy.validation.nonNegativeInteger }).int({ error: pricesCopy.validation.nonNegativeInteger }).min(0, { error: pricesCopy.validation.nonNegativeInteger }),
    unitId: z.string(),
    unitName: z.string(),
  })
  .superRefine((value, context) => {
    if (value.scope === "unit" && !value.unitId.trim()) {
      context.addIssue({
        code: "custom",
        message: pricesCopy.validation.required,
        path: ["unitId"],
      })
    }

    if (value.endsAt && value.endsAt <= value.startsAt) {
      context.addIssue({
        code: "custom",
        message: pricesCopy.validation.endBeforeStart,
        path: ["endsAt"],
      })
    }
  })

function getPriceTableFormErrors(error: z.ZodError): PriceTableFormErrors {
  return error.issues.reduce<PriceTableFormErrors>((errors, issue) => {
    const fieldName = issue.path[0]

    if (typeof fieldName === "string" && fieldName in createEmptyPriceTableFormValues()) {
      errors[fieldName as keyof PriceTableFormValues] = issue.message
    }

    return errors
  }, {})
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
  const result = priceTableValidationSchema.safeParse({
    id: values.id,
    amount: parseNumber(values.amount),
    cycleHours: parseInteger(values.cycleHours),
    endsAt: values.endsAt ? toIso(values.endsAt) ?? "" : null,
    graceMinutes: parseInteger(values.graceMinutes),
    name: values.name,
    notes: values.notes,
    scope: values.scope,
    startsAt: toIso(values.startsAt),
    status: values.status,
    toleranceMinutes: parseInteger(values.toleranceMinutes),
    unitId: values.unitId,
    unitName: values.unitName,
  })

  if (!result.success) {
    return { success: false as const, errors: getPriceTableFormErrors(result.error) }
  }

  const scope = result.data.scope
  const status = result.data.status
  const payload: SavePriceTablePayload = {
    id: result.data.id,
    name: result.data.name,
    scope,
    unitId: scope === "unit" ? result.data.unitId.trim() : null,
    unitName: scope === "unit" ? result.data.unitName.trim() || null : null,
    graceMinutes: result.data.graceMinutes,
    toleranceMinutes: result.data.toleranceMinutes,
    cycleHours: result.data.cycleHours,
    amount: result.data.amount,
    startsAt: result.data.startsAt,
    endsAt: result.data.endsAt,
    status,
    notes: result.data.notes.trim() || null,
  }

  return {
    success: true as const,
    data: payload,
    errors: {} as PriceTableFormErrors,
  }
}
