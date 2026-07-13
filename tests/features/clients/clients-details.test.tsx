import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import {
  ClientsRoute,
  configureClientsGateway,
  resetClientsGateway,
} from "@/features/clients"

beforeEach(() => {
  configureClientsGateway({
    async listClientsPayload() {
      await Promise.resolve()
      return [
        {
          cod_pessoa: 1001,
          nom_pessoa: "Auto Center Alfa Ltda",
          nom_fantasia: "Auto Center Alfa",
          num_cnpj_cpf: "12.345.678/0001-10",
          des_email_1: "contato@alfa.com.br",
          num_telefone_1: "(11) 3333-4444",
          nom_cidade: "Sao Paulo",
          sgl_estado: "sp",
          dta_cadastro: "2024-01-15",
          ind_pessoa_ativa: "S",
          bloqueio_financeiro: "N",
          qtd_veiculos: 2,
          dta_ultima_compra: "2026-06-20",
          is_active_120d: true,
        },
      ]
    },
    async listClientVehiclesPayload() {
      await Promise.resolve()
      return []
    },
  })
})

afterEach(() => {
  resetClientsGateway()
})

describe("ClientsRoute details", () => {
  it("opens details from the primary company name text", async () => {
    render(
      <MemoryRouter>
        <ClientsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa Ltda")).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Auto Center Alfa Ltda" })
    )

    expect(screen.getAllByText("Código do cliente").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("heading", { name: "Auto Center Alfa Ltda" })
    ).toBeInTheDocument()
  })

  it("opens details from the row actions menu", async () => {
    render(
      <MemoryRouter>
        <ClientsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa Ltda")).toBeInTheDocument()
    })

    fireEvent.pointerDown(
      screen.getAllByRole("button", { name: "Abrir ações da linha" })[0]
    )

    fireEvent.click(await screen.findByRole("menuitem", { name: "Detalhes" }))

    expect(screen.getAllByText("Código do cliente").length).toBeGreaterThan(0)
  })
})
