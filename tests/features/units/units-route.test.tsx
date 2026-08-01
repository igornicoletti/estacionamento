import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { UnitsRoute } from "@/features/units/routes/units-route"
import {
  resetUnitYardGateway,
  setUnitYardGateway,
} from "@/features/units/gateways/unit-yard-gateway"
import {
  resetUnitsGateway,
  setUnitsGateway,
} from "@/features/units/gateways/units-gateway"

const unitRow = {
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
} as const

beforeEach(() => {
  setUnitsGateway({
    findUnitById: (unitId) =>
      Promise.resolve(unitId === unitRow.cod_empresa ? unitRow : null),
    listUnits: () => Promise.resolve([unitRow]),
  })
  setUnitYardGateway({
    findConfigByUnitId: () => Promise.resolve(null),
    listConfigs: () => Promise.resolve([]),
  })
})

afterEach(() => {
  resetUnitYardGateway()
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
    expect(
      screen.getByRole("button", { name: "Atualizar dados" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Monte Carlo Centro")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Monte Carlo Centro" }))

    await waitFor(() => {
      expect(screen.getByText("Detalhes da unidade")).toBeInTheDocument()
    })
    expect(screen.getAllByText("Código").length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Fechar" }).length).toBeGreaterThan(0)
  })
})
