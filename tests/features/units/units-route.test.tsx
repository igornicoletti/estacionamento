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
  configureUnitsGateway,
  resetUnitsGateway,
} from "@/features/units"

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
  resetUnitsGateway()
})

describe("UnitsRoute", () => {
  it("renders units header and opens row details from first column", async () => {
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
    expect(screen.getByRole("heading", { name: "Posto Monte Carlo Centro Ltda" })).toBeInTheDocument()

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])
    expect(
      await screen.findByRole("menuitem", { name: "Usuários" })
    ).toBeInTheDocument()

    const configureYardAction = await screen.findByRole("menuitem", { name: "Configurar pátio" })
    expect(configureYardAction).toBeInTheDocument()

    fireEvent.click(configureYardAction)
    expect(
      await screen.findByRole("heading", { name: "Configurar pátio da unidade" })
    ).toBeInTheDocument()
  }, 15_000)
})
