import { beforeEach, describe, expect, it, vi } from "vitest"

const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }))

describe("Supabase clients gateway", () => {
  beforeEach(() => {
    vi.resetModules()
    supabaseMock.from.mockReset()
    vi.doMock("@/lib/supabase-browser", () => ({
      getSupabaseBrowserClient: () => ({ from: supabaseMock.from }),
    }))
  })

  it("paginates active clients deterministically", async () => {
    const row = createClientRow()
    const query = createListQuery()
    query.range
      .mockResolvedValueOnce({
        data: Array.from({ length: 500 }, () => row),
        error: null,
      })
      .mockResolvedValueOnce({ data: [row], error: null })
    supabaseMock.from.mockReturnValue(query)

    const { createSupabaseClientsGateway } = await import(
      "@/features/clients/gateways/supabase-clients-gateway"
    )
    const rows = await createSupabaseClientsGateway().listClients()

    expect(supabaseMock.from).toHaveBeenCalledWith("erp_clients")
    expect(query.eq).toHaveBeenCalledWith("is_active_120d", true)
    expect(query.order).toHaveBeenCalledWith("cod_pessoa", {
      ascending: true,
    })
    expect(query.range).toHaveBeenNthCalledWith(1, 0, 499)
    expect(query.range).toHaveBeenNthCalledWith(2, 500, 999)
    expect(rows).toHaveLength(501)
  })

  it("queries one client by ID and fails closed on malformed data", async () => {
    const query = createListQuery()
    query.maybeSingle.mockResolvedValue({
      data: { ...createClientRow(), cod_pessoa: Number.MAX_SAFE_INTEGER + 1 },
      error: null,
    })
    supabaseMock.from.mockReturnValue(query)

    const { createSupabaseClientsGateway } = await import(
      "@/features/clients/gateways/supabase-clients-gateway"
    )

    await expect(
      createSupabaseClientsGateway().findClientById(1001)
    ).rejects.toThrow(
      "A resposta de clientes retornou em formato inválido."
    )
    expect(query.eq).toHaveBeenNthCalledWith(1, "cod_pessoa", 1001)
    expect(query.eq).toHaveBeenNthCalledWith(2, "is_active_120d", true)
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

function createClientRow() {
  return {
    bloqueio_financeiro: "N",
    cod_pessoa: 1001,
    des_email_1: "contato@alfa.com.br",
    dta_cadastro: "2024-01-15",
    dta_ultima_compra: "2026-06-20",
    ind_pessoa_ativa: "S",
    is_active_120d: true,
    nom_cidade: "Sao Paulo",
    nom_fantasia: "Auto Center Alfa",
    nom_pessoa: "Auto Center Alfa Ltda",
    num_cnpj_cpf: "12.345.678/0001-10",
    num_telefone_1: "(11) 3333-4444",
    qtd_veiculos: 2,
    sgl_estado: "SP",
  }
}
