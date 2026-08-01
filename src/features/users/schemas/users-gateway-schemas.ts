import { z } from "zod"

const unitLinkSchema = z.object({ unit_id: z.string() })

export const unitLinksSchema = z.union([
  unitLinkSchema,
  z.array(unitLinkSchema),
  z.null(),
])

export const appUserRowSchema = z.object({
  app_user_units: unitLinksSchema.optional(),
  auth_user_id: z.uuid(),
  cpf_display: z.string().nullable(),
  cpf_masked: z.string(),
  email: z.string().nullable(),
  id: z.uuid(),
  locked_until: z.string().nullable(),
  name: z.string(),
  phone_display: z.string().nullable(),
  phone_masked: z.string(),
  role: z.string(),
  status: z.string(),
})

export const appUserRowsSchema = z.array(appUserRowSchema)

export const userIdentityRowSchema = z.object({
  auth_user_id: z.uuid(),
  id: z.uuid(),
})

export const lastAccessRowsSchema = z.array(
  z.object({
    auth_user_id: z.uuid(),
    last_sign_in_at: z.string().nullable(),
  })
)

export const factorsResponseSchema = z.object({
  factors: z.array(
    z.object({
      auth_user_id: z.uuid(),
      passkey_count: z.number().int().nonnegative(),
    })
  ),
  ok: z.literal(true),
})

export const invokeResponseSchema = z.object({
  data: z.unknown(),
  error: z.unknown().nullable(),
})

export const mutationResponseSchema = z.object({
  authUserId: z.uuid(),
  id: z.uuid(),
  ok: z.literal(true),
})

export type AppUserRowPayload = z.infer<typeof appUserRowSchema>
export type UnitLinksPayload = z.infer<typeof unitLinksSchema>
