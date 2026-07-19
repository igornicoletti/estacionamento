import { z } from "zod"

import { unitsCopy } from "../constants"
import { type UpsertUnitYardConfigInput } from "./units-types"

export const unitYardConfigSchema = z.object({
  unitId: z.string({ error: unitsCopy.errors.unitYardInvalidUnit }).trim().min(1, { error: unitsCopy.errors.unitYardInvalidUnit }),
  unitName: z.string().trim().optional(),
  patioActive: z.boolean({ error: unitsCopy.errors.unitYardSave }),
  parkingSpots: z
    .number({ error: unitsCopy.yard.validationInvalidSpots })
    .int({ error: unitsCopy.yard.validationInvalidSpots })
    .min(0, { error: unitsCopy.yard.validationInvalidSpots }),
})

export type UnitYardConfigFormValues = z.infer<typeof unitYardConfigSchema>

export function validateUpsertUnitYardConfigInput(
  input: UpsertUnitYardConfigInput
): UpsertUnitYardConfigInput {
  return unitYardConfigSchema.parse(input)
}
