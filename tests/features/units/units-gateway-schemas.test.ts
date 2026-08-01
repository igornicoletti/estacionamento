import { describe, expect, it } from "vitest"

import {
  erpUnitRowSchema,
  unitUserStatsRowSchema,
  unitYardConfigRowSchema,
} from "@/features/units/schemas/units-gateway-schemas"

describe("units gateway schemas", () => {
  it("coerces safe unit identifiers and rejects unsafe values", () => {
    const result = erpUnitRowSchema.parse({
      cod_bandeira: "1",
      cod_cidade: "0",
      cod_empresa: "7",
      des_bandeira: null,
      des_coordenada_empresa: null,
      ip_rede: null,
      nom_banco_dados: null,
      nom_cidade: null,
      nom_estado: null,
      nom_fantasia: null,
      nom_razao_social: null,
      num_cnpj: null,
      sgl_estado: null,
    })

    expect(result.cod_empresa).toBe(7)
    expect(
      erpUnitRowSchema.safeParse({ ...result, cod_empresa: 0 }).success
    ).toBe(false)
  })

  it("rejects negative yard capacity and user counters", () => {
    expect(
      unitYardConfigRowSchema.safeParse({
        parking_spots: -1,
        patio_active: true,
        unit_id: 1,
        updated_at: "2026-08-01T12:00:00.000Z",
      }).success
    ).toBe(false)
    expect(
      unitUserStatsRowSchema.safeParse({
        managers: 0,
        operators: -1,
        unit_id: 1,
      }).success
    ).toBe(false)
  })
})
