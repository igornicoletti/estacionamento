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
  UnitsRoute,
  configureUnitYardGateway,
  configureUnitsGateway,
  resetUnitYardGateway,
  resetUnitsGateway,
} from "@/features/units"
import type {
  UnitYardConfig,
  UpsertUnitYardConfigInput,
} from "@/features/units/types/units-types"
import { setUsersGateway, type UserRecord } from "@/features/users"

function configureMemoryYardGateway(seed: UnitYardConfig[] = []) {
  const store = seed.map((item) => ({ ...item }))

  configureUnitYardGateway({
    async listConfigs() {
      await Promise.resolve()
      return store.map((item) => ({ ...item }))
    },
    async upsertConfig(input: UpsertUnitYardConfigInput) {
      await Promise.resolve()

      const config: UnitYardConfig = {
        parkingSpots: input.parkingSpots,
        patioActive: input.patioActive,
        unitId: input.unitId,
        updatedAt: "2026-07-17T12:00:00.000Z",
      }
      const index = store.findIndex((item) => item.unitId === config.unitId)

      if (index >= 0) {
        store[index] = config
      } else {
        store.push(config)
      }

      return { ...config }
    },
  })
}

beforeEach(() => {
  configureUnitsGateway({
    async listUnitsPayload() {
      await Promise.resolve()
      return [
        {
          cod_empresa: 1,
          nom_razao_social: "Posto Monte Carlo Centro Ltda",
          nom_fantasia: "Monte Carlo Centro",
          num_cnpj: "00.000.000/0001-00",
          cod_bandeira: 10,
          des_bandeira: "Shell",
          cod_cidade: 3550308,
          nom_cidade: "São Paulo",
          nom_estado: "São Paulo",
          sgl_estado: "SP",
          des_coordenada_empresa: "-23.550520, -46.633308",
          ip_rede: "192.168.0.10",
          nom_banco_dados: "erp_montecarlo_centro",
        },
      ]
    },
  })
})

afterEach(() => {
  resetUnitYardGateway()
  resetUnitsGateway()
})

describe("UnitsRoute", () => {
  it("renders units header and opens row details from first column", async () => {
    configureMemoryYardGateway()

    render(
      <MemoryRouter>
        <UnitsRoute />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Unidades" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Histórico" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sincronizar" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Monte Carlo Centro")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Monte Carlo Centro" }))

    expect(screen.getAllByText("Código").length).toBeGreaterThan(0)
    expect(screen.getByRole("heading", { name: "Monte Carlo Centro" })).toBeInTheDocument()
    expect(screen.getAllByText("Posto Monte Carlo Centro Ltda").length).toBeGreaterThan(0)

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])
    expect(
      await screen.findByRole("menuitem", { name: "Funcionários" })
    ).toBeInTheDocument()

    const configureYardAction = await screen.findByRole("menuitem", { name: "Configurar pátio" })
    expect(configureYardAction).toBeInTheDocument()

    fireEvent.click(configureYardAction)
    expect(
      await screen.findByRole("heading", { name: "Configurar pátio da unidade" })
    ).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" })
    fireEvent.click(await screen.findByRole("option", { name: "Ativo" }))
    fireEvent.change(screen.getByLabelText("Quantidade de vagas"), {
      target: { value: "42" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Configurar pátio da unidade" })
      ).not.toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: "Monte Carlo Centro" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Monte Carlo Centro" }))
    expect(screen.getByRole("heading", { name: "Monte Carlo Centro" })).toBeInTheDocument()
    expect(screen.getAllByText("42").length).toBeGreaterThan(0)
  }, 15_000)

  it("shows an inert dash when the unit has no employees", async () => {
    configureMemoryYardGateway()
    setUsersGateway({
      async list(): Promise<UserRecord[]> {
        await Promise.resolve()
        return []
      },
      async saveAll() {
        await Promise.resolve()
      },
    })

    render(
      <MemoryRouter>
        <UnitsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Monte Carlo Centro")).toBeInTheDocument()
    })

    expect(screen.getByText("Funcionários")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "0" })).not.toBeInTheDocument()

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])

    expect(
      await screen.findByRole("menuitem", { name: "Configurar pátio" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Funcionários" })).not.toBeInTheDocument()
  }, 15_000)
})
