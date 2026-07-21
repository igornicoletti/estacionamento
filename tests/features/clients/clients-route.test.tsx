import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import {
  ClientsRoute,
  ClientVehiclesRoute,
  configureClientsGateway,
  resetClientsGateway,
} from "@/features/clients"
import { clearAsyncSnapshotCache } from "@/hooks/use-async-snapshot"

beforeEach(() => {
  clearAsyncSnapshotCache()
  configureClientsGateway({
    async listClientsPayload() {
      await Promise.resolve()
      return [
        {
          cod_pessoa: 1001,
          nom_pessoa: "Auto Center Alfa Ltda",
          nom_fantasia: "Auto Center Alfa",
          num_cnpj_cpf: "22111333000144",
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
    async listClientPayloadById(clientId) {
      await Promise.resolve()
      if (clientId === 1001) {
        return {
          cod_pessoa: 1001,
          nom_pessoa: "Auto Center Alfa Ltda",
          nom_fantasia: "Auto Center Alfa",
          num_cnpj_cpf: "22111333000144",
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
        }
      }
      return null
    },
    async listClientVehiclesPayload() {
      await Promise.resolve()
      return [
        {
          cod_veiculo: 5001,
          cod_pessoa: 1001,
          nom_pessoa: "Auto Center Alfa Ltda",
          nom_fantasia: "Auto Center Alfa",
          num_cnpj_cpf: "22111333000144",
          num_placa: "ABC1D23",
          des_veiculo: "Fiat Strada 1.4",
          nom_motorista: "Joao Carlos",
        },
      ]
    },
    async listClientVehiclesPayloadByClientId(clientId) {
      await Promise.resolve()
      if (clientId === 1001) {
        return [
          {
            cod_veiculo: 5001,
            cod_pessoa: 1001,
            nom_pessoa: "Auto Center Alfa Ltda",
            nom_fantasia: "Auto Center Alfa",
            num_cnpj_cpf: "22111333000144",
            num_placa: "ABC1D23",
            des_veiculo: "Fiat Strada 1.4",
            nom_motorista: "Joao Carlos",
          },
        ]
      }
      return []
    },
  })
})

afterEach(() => {
  resetClientsGateway()
})

describe("Clients routes", () => {
  it("renders clients page and navigates to client vehicles from row actions", async () => {
    render(
      <MemoryRouter initialEntries={["/clientes"]}>
        <Routes>
          <Route path="/clientes" element={<ClientsRoute />} />
          <Route path="/clientes/:cod_pessoa" element={<ClientVehiclesRoute />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Clientes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Histórico" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sincronizar" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa Ltda")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])

    expect(screen.getByText("22.***.***/****-44")).toBeInTheDocument()
    expect(screen.queryByText("22111333000144")).not.toBeInTheDocument()

    const vehiclesMenuItem = await screen.findByRole("menuitem", { name: "Exibir veículos" })
    fireEvent.click(vehiclesMenuItem)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Auto Center Alfa Ltda" })
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole("heading", { name: "Auto Center Alfa Ltda" })
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText("ABC1D23")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", {
      name: "Segure para visualizar o conteúdo completo",
    })[0]).toHaveTextContent("22.***.***/****-44")
    expect(screen.queryByRole("button", { name: "Histórico" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Sincronizar" })).not.toBeInTheDocument()
  }, 15_000)
})
