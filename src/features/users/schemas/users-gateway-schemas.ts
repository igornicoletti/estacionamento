import { z } from "zod"

const unitLinkSchema = z
  .object({ unit_id: z.string().trim().min(1).max(64) })
  .strict()

export const unitLinksSchema = z.union([
  unitLinkSchema,
  z.array(unitLinkSchema),
  z.null(),
])

export const appUserRowSchema = z
  .object({
    app_user_units: unitLinksSchema.optional(),
    auth_user_id: z.uuid(),
    cpf_display: z.string().max(32).nullable(),
    cpf_masked: z.string().min(1).max(32),
    email: z.email().max(254).nullable(),
    id: z.uuid(),
    locked_until: z.iso.datetime({ offset: true }).nullable(),
    name: z.string().min(1).max(120),
    phone_display: z.string().max(32).nullable(),
    phone_masked: z.string().min(1).max(32),
    role: z.string().min(1).max(32),
    status: z.string().min(1).max(32),
  })
  .strict()

export const appUserRowsSchema = z.array(appUserRowSchema)

export const userIdentityRowSchema = z
  .object({
    auth_user_id: z.uuid(),
    id: z.uuid(),
  })
  .strict()

export const lastAccessRowsSchema = z.array(
  z
    .object({
      auth_user_id: z.uuid(),
      last_sign_in_at: z.iso.datetime({ offset: true }).nullable(),
    })
    .strict()
)

export const factorsResponseSchema = z
  .object({
    factors: z.array(
      z
        .object({
          auth_user_id: z.uuid(),
          passkey_count: z.number().int().nonnegative(),
        })
        .strict()
    ),
    ok: z.literal(true),
  })
  .strict()

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
