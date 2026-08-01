import { describe, expect, it } from "vitest"

import { deduplicateVehicles } from "../../supabase/functions/clients-sync/deduplicate-vehicles"

describe("clients sync vehicle canonicalization", () => {
  it("keeps the newest record when an ERP vehicle id is repeated", () => {
    const result = deduplicateVehicles([
      { cod_veiculo: 10, num_placa: "ABC1D23", source_updated_at: "2026-01-01T00:00:00Z" },
      { cod_veiculo: 10, num_placa: "XYZ9A87", source_updated_at: "2026-02-01T00:00:00Z" },
    ])

    expect(result.rows).toEqual([
      { cod_veiculo: 10, num_placa: "XYZ9A87", source_updated_at: "2026-02-01T00:00:00Z" },
    ])
    expect(result.collapsed).toBe(1)
  })

  it("keeps one deterministic owner when a plate is repeated", () => {
    const result = deduplicateVehicles([
      { cod_veiculo: 10, num_placa: "ABC1D23", source_updated_at: null },
      { cod_veiculo: 20, num_placa: "ABC1D23", source_updated_at: null },
    ])

    expect(result.rows).toEqual([
      { cod_veiculo: 20, num_placa: "ABC1D23", source_updated_at: null },
    ])
    expect(result.collapsed).toBe(1)
  })
})
