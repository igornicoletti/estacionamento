import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  configureClientsGateway,
  resetClientsGateway,
} from "@/features/clients"
import {
  RulesRoute,
  type SaveVipRuleInput,
  type VipRule,
} from "@/features/rules"
import {
  configureUnitYardGateway,
  configureUnitsGateway,
  resetUnitYardGateway,
  resetUnitsGateway,
} from "@/features/units"
import { clearAsyncSnapshotCache } from "@/hooks/use-async-snapshot"

const {
  listVipRulesMock,
  saveVipRuleMock,
  toggleClientVipMock,
  toggleVehicleVipMock,
} = vi.hoisted(() => ({
  listVipRulesMock: vi.fn<() => Promise<VipRule[]>>(),
  saveVipRuleMock: vi.fn<(input: SaveVipRuleInput) => Promise<void>>(),
  toggleClientVipMock: vi.fn(),
  toggleVehicleVipMock: vi.fn(),
}))

vi.mock("@/features/rules/services/vip-rules-service", () => ({
  listVipRules: listVipRulesMock,
  saveVipRule: saveVipRuleMock,
  toggleClientVip: toggleClientVipMock,
  toggleVehicleVip: toggleVehicleVipMock,
}))

const activeVipRule: VipRule = {
  active: true,
  appliesToAllUnits: true,
  benefitHours: null,
  clientId: 1001,
  clientName: "Auto Center Alfa",
  createdAt: null,
  fuelMinLiters: null,
  id: "rule-vip-1001",
  notes: null,
  targetType: "client",
  type: "vip",
  unitIds: [],
  updatedAt: "2026-07-02T12:00:00.000Z",
  vehicleId: null,
  vehicleIds: [],
  vehiclePlate: null,
  yardOccupancyThreshold: null,
  yardStaleVehicleHours: null,
}

const inactiveVipRule: VipRule = {
  ...activeVipRule,
  active: false,
  id: "rule-vip-1001-inactive",
}

function configureCatalogGateways() {
  configureClientsGateway({
    async listClientsPayload() {
      await Promise.resolve()
      return [
        {
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
          qtd_veiculos: 1,
          sgl_estado: "SP",
        },
      ]
    },
    async listClientPayloadById(clientId) {
      await Promise.resolve()
      return clientId === 1001
        ? {
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
          qtd_veiculos: 1,
          sgl_estado: "SP",
        }
        : null
    },
    async listClientVehiclesPayload() {
      await Promise.resolve()
      return [
        {
          cod_pessoa: 1001,
          cod_veiculo: 5001,
          des_veiculo: "Fiat Strada 1.4",
          nom_fantasia: "Auto Center Alfa",
          nom_motorista: "Joao Carlos",
          nom_pessoa: "Auto Center Alfa Ltda",
          num_cnpj_cpf: "12.345.678/0001-10",
          num_placa: "ABC1D23",
        },
      ]
    },
    async listClientVehiclesPayloadByClientId(clientId) {
      await Promise.resolve()
      return clientId === 1001
        ? [
          {
            cod_pessoa: 1001,
            cod_veiculo: 5001,
            des_veiculo: "Fiat Strada 1.4",
            nom_fantasia: "Auto Center Alfa",
            nom_motorista: "Joao Carlos",
            nom_pessoa: "Auto Center Alfa Ltda",
            num_cnpj_cpf: "12.345.678/0001-10",
            num_placa: "ABC1D23",
          },
        ]
        : []
    },
  })

  configureUnitsGateway({
    async listUnitsPayload() {
      await Promise.resolve()
      return [
        {
          cod_bandeira: 10,
          cod_cidade: 3550308,
          cod_empresa: 1,
          des_bandeira: "Shell",
          des_coordenada_empresa: "-23.550520, -46.633308",
          ip_rede: "192.168.0.10",
          nom_banco_dados: "erp_montecarlo_centro",
          nom_cidade: "Sao Paulo",
          nom_estado: "Sao Paulo",
          nom_fantasia: "Monte Carlo Centro",
          nom_razao_social: "Posto Monte Carlo Centro Ltda",
          num_cnpj: "00.000.000/0001-00",
          sgl_estado: "SP",
        },
      ]
    },
  })

  configureUnitYardGateway({
    async listConfigs() {
      await Promise.resolve()
      return [
        {
          parkingSpots: 42,
          patioActive: true,
          unitId: "1",
          updatedAt: "2026-07-17T12:00:00.000Z",
        },
      ]
    },
    async upsertConfig() {
      await Promise.resolve()
      throw new Error("Unexpected yard config write")
    },
  })
}

async function openCreateRuleDialog() {
  await waitFor(() => {
    expect(screen.getByText("Auto Center Alfa")).toBeInTheDocument()
  })

  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Adicionar regra" })).toBeInTheDocument()
  })
}

async function selectClient() {
  const clientField = screen.getByLabelText("Nome do cliente")

  fireEvent.keyDown(clientField, { key: "ArrowDown" })
  fireEvent.click(await screen.findByRole("option", { name: "Auto Center Alfa" }))
}

describe("RulesRoute", () => {
  beforeEach(() => {
    clearAsyncSnapshotCache()
    configureCatalogGateways()
    listVipRulesMock.mockReset()
    saveVipRuleMock.mockReset()
    toggleClientVipMock.mockReset()
    toggleVehicleVipMock.mockReset()
    listVipRulesMock.mockResolvedValue([activeVipRule])
    saveVipRuleMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    resetClientsGateway()
    resetUnitYardGateway()
    resetUnitsGateway()
  })

  it("validates required rule fields before saving", async () => {
    render(
      <MemoryRouter>
        <RulesRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Cliente VIP").closest("[data-slot='badge']")).toBeNull()
    })
    await openCreateRuleDialog()
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(await screen.findByText("Informe um código de cliente válido.")).toBeInTheDocument()
    expect(saveVipRuleMock).not.toHaveBeenCalled()
  }, 15_000)

  it("creates a VIP rule and closes the form on success", async () => {
    render(
      <MemoryRouter>
        <RulesRoute />
      </MemoryRouter>
    )

    await openCreateRuleDialog()
    await selectClient()
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(saveVipRuleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          appliesToAllUnits: true,
          clientId: 1001,
          clientName: "Auto Center Alfa",
          type: "vip",
          targetType: "client",
        })
      )
    })
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Adicionar regra" })
      ).not.toBeInTheDocument()
    })
  }, 15_000)

  it("keeps the rule form open with a sanitized error when save fails", async () => {
    saveVipRuleMock.mockRejectedValueOnce(new Error("duplicate key value violates constraint"))

    render(
      <MemoryRouter>
        <RulesRoute />
      </MemoryRouter>
    )

    await openCreateRuleDialog()
    await selectClient()
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Adicionar regra" })).toBeInTheDocument()
    })
    expect(screen.queryByText(/duplicate key/i)).not.toBeInTheDocument()
  }, 15_000)

  it("requires AppAlertDialog confirmation before deactivating a rule", async () => {
    render(
      <MemoryRouter>
        <RulesRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])
    fireEvent.click(await screen.findByRole("menuitem", { name: "Inativar" }))

    expect(screen.getByRole("heading", { name: "Inativar regra" })).toBeInTheDocument()
    expect(saveVipRuleMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))

    await waitFor(() => {
      expect(saveVipRuleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
          clientId: 1001,
          type: "vip",
        })
      )
    })
  }, 15_000)

  it("shows activate action for inactive rules", async () => {
    listVipRulesMock.mockResolvedValueOnce([inactiveVipRule])

    render(
      <MemoryRouter>
        <RulesRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])

    expect(await screen.findByRole("menuitem", { name: "Ativar" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Inativar" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("menuitem", { name: "Ativar" }))
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))

    await waitFor(() => {
      expect(saveVipRuleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          clientId: 1001,
          type: "vip",
        })
      )
    })
  }, 15_000)
})
