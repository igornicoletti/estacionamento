import { z } from "zod"

import { pricesCopy } from "../prices-copy"
import {
  priceRecordStatusValues,
  priceTableScopeValues,
} from "../types/prices-types"

export const priceTableFormSchema = z
  .object({
    scope: z.enum(priceTableScopeValues),
    unitId: z.string().trim().nullable(),
    unitName: z.string().trim().nullable(),
    amount: z
      .number({ error: pricesCopy.form.validation.amount })
      .nonnegative({ error: pricesCopy.form.validation.amount })
      .finite({ error: pricesCopy.form.validation.amount }),
    cycleHours: z
      .number({ error: pricesCopy.form.validation.cycleHours })
      .int({ error: pricesCopy.form.validation.cycleHours })
      .min(1, { error: pricesCopy.form.validation.cycleHours })
      .max(720, { error: pricesCopy.form.validation.cycleHours }),
    graceMinutes: z
      .number({ error: pricesCopy.form.validation.graceMinutes })
      .int({ error: pricesCopy.form.validation.graceMinutes })
      .min(0, { error: pricesCopy.form.validation.graceMinutes })
      .max(1440, { error: pricesCopy.form.validation.graceMinutes }),
    toleranceMinutes: z
      .number({ error: pricesCopy.form.validation.toleranceMinutes })
      .int({ error: pricesCopy.form.validation.toleranceMinutes })
      .min(0, { error: pricesCopy.form.validation.toleranceMinutes })
      .max(240, { error: pricesCopy.form.validation.toleranceMinutes }),
    startsAt: z
      .string({ error: pricesCopy.form.validation.startsAt })
      .min(1, { error: pricesCopy.form.validation.startsAt }),
    endsAt: z.string().nullable(),
    status: z.enum(priceRecordStatusValues),
    reason: z
      .string({ error: pricesCopy.form.validation.reason })
      .trim()
      .min(10, { error: pricesCopy.form.validation.reason }),
    notes: z.string().trim().nullable(),
  })
  .refine(
    (data) => {
      if (data.scope === "unit") {
        return Boolean(data.unitId?.trim())
      }
      return true
    },
    { path: ["unitId"], error: pricesCopy.form.validation.unitId }
  )
  .refine(
    (data) => {
      if (data.scope === "unit") {
        return Boolean(data.unitName?.trim())
      }
      return true
    },
    { path: ["unitName"], error: pricesCopy.form.validation.unitName }
  )
  .refine(
    (data) => {
      const startsAt = new Date(data.startsAt)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !Number.isNaN(startsAt.getTime()) && startsAt.getTime() >= today.getTime()
    },
    { path: ["startsAt"], error: pricesCopy.form.validation.startsAt }
  )

export type PriceTableFormValues = z.infer<typeof priceTableFormSchema>
