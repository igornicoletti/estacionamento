import { describe, expect, it } from "vitest"

import {
  appUserRowsSchema,
  factorsResponseSchema,
  mutationResponseSchema,
} from "@/features/users/schemas/users-gateway-schemas"

const appUserId = "11111111-1111-4111-8111-111111111111"
const authUserId = "22222222-2222-4222-8222-222222222222"

describe("users gateway schemas", () => {
  it("accepts the expected Supabase user projection", () => {
    const result = appUserRowsSchema.safeParse([
      {
        app_user_units: [{ unit_id: "2" }],
        auth_user_id: authUserId,
        cpf_display: "529.982.247-25",
        cpf_masked: "***.***.***-25",
        email: "user@example.com",
        id: appUserId,
        locked_until: null,
        name: "Usuário Válido",
        phone_display: "(11) 98888-7777",
        phone_masked: "(11) *****-7777",
        role: "operator",
        status: "active",
      },
    ])

    expect(result.success).toBe(true)
  })

  it("rejects malformed identities and mutation responses", () => {
    expect(
      mutationResponseSchema.safeParse({
        authUserId: "not-a-uuid",
        id: appUserId,
        ok: true,
      }).success
    ).toBe(false)
  })

  it("rejects impossible passkey counts", () => {
    expect(
      factorsResponseSchema.safeParse({
        factors: [{ auth_user_id: authUserId, passkey_count: -1 }],
        ok: true,
      }).success
    ).toBe(false)
  })
})
