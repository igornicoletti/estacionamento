import { z } from "zod"

const scopeSchema = z.enum(["global", "unit", "network"])
const statusSchema = z.enum(["active", "inactive", "draft", "archived"])

export const priceTableFormSchema = z
  .object({
    scope: scopeSchema,
    unitId: z.union([z.string(), z.null()]),
    unitName: z.union([z.string(), z.null()]),
    amount: z.number().finite().positive(),
    cycleHours: z.number().int().min(1).max(720),
    graceMinutes: z.number().int().min(0).max(1440),
    toleranceMinutes: z.number().int().min(0).max(240),
    startsAt: z.string().min(1),
    endsAt: z.union([z.string(), z.null()]),
    status: statusSchema,
    notes: z.union([z.string(), z.null()]),
  })
  .refine(
    (value) => value.scope !== "unit" || (Boolean(value.unitId?.trim()) && Boolean(value.unitName?.trim())),
    {
      path: ["unitId"],
      message: "Campo obrigatório.",
    }
  )
