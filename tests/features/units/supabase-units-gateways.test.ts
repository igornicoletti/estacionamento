import { beforeEach, describe, expect, it, vi } from "vitest"

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

describe("Supabase units gateways", () => {
  beforeEach(() => {
    vi.resetModules()
    supabaseMock.from.mockReset()
    supabaseMock.rpc.mockReset()
    vi.doMock("@/lib/supabase-browser", () => ({
      getSupabaseBrowserClient: () => ({
        from: supabaseMock.from,
        rpc: supabaseMock.rpc,
      }),
    }))
  })

  it("paginates the unit catalog deterministically", async () => {
    const row = createUnitRow()
    const query = createListQuery()
    query.range
      .mockResolvedValueOnce({
        data: Array.from({ length: 500 }, () => row),
        error: null,
      })
      .mockResolvedValueOnce({ data: [row], error: null })
    supabaseMock.from.mockReturnValue(query)

    const { createSupabaseUnitsGateway } = await import(
      "@/features/units/gateways/supabase-units-gateway"
    )
    const rows = await createSupabaseUnitsGateway().listUnits()

    expect(query.order).toHaveBeenCalledWith("cod_empresa", {
      ascending: true,
    })
    expect(query.range).toHaveBeenNthCalledWith(1, 0, 499)
    expect(query.range).toHaveBeenNthCalledWith(2, 500, 999)
    expect(rows).toHaveLength(501)
  })

  it("reads one yard configuration without loading the whole table", async () => {
    const query = createListQuery()
    query.maybeSingle.mockResolvedValue({
      data: {
        parking_spots: 42,
        patio_active: true,
        unit_id: 7,
        updated_at: "2026-08-01T12:00:00.000Z",
      },
      error: null,
    })
    supabaseMock.from.mockReturnValue(query)

    const { createSupabaseUnitYardGateway } = await import(
      "@/features/units/gateways/supabase-unit-yard-gateway"
    )
    const result = await createSupabaseUnitYardGateway()
      .findConfigByUnitId("7")

    expect(query.eq).toHaveBeenCalledWith("unit_id", "7")
    expect(query.maybeSingle).toHaveBeenCalledOnce()
    expect(result).toMatchObject({ parking_spots: 42, unit_id: 7 })
  })

  it("validates the protected aggregate RPC response", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: [{ managers: "1", operators: 2, unit_id: "7" }],
      error: null,
    })

    const { createSupabaseUnitUserStatsGateway } = await import(
      "@/features/units/gateways/supabase-unit-user-stats-gateway"
    )
    const result = await createSupabaseUnitUserStatsGateway().listStats()

    expect(supabaseMock.rpc).toHaveBeenCalledWith("list_unit_user_stats")
    expect(result).toEqual([{ managers: 1, operators: 2, unit_id: 7 }])
  })

  it("fails closed when the aggregate RPC returns invalid counters", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: [{ managers: -1, operators: 2, unit_id: 7 }],
      error: null,
    })

    const { createSupabaseUnitUserStatsGateway } = await import(
      "@/features/units/gateways/supabase-unit-user-stats-gateway"
    )

    await expect(
      createSupabaseUnitUserStatsGateway().listStats()
    ).rejects.toThrow("Não foi possível carregar os funcionários da unidade.")
  })
})

function createListQuery() {
  const query = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    select: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  return query
}

function createUnitRow() {
  return {
    cod_bandeira: 1,
    cod_cidade: 0,
    cod_empresa: 7,
    des_bandeira: "BR",
    des_coordenada_empresa: "",
    ip_rede: "",
    nom_banco_dados: "",
    nom_cidade: "ONDA VERDE",
    nom_estado: "SAO PAULO",
    nom_fantasia: "ONDA VERDE",
    nom_razao_social: "AUTO POSTO MONTE CARLO ONDA VERDE LTDA",
    num_cnpj: "",
    sgl_estado: "SP",
  }
}
