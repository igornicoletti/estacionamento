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
  resetUnitUserStatsGateway,
  setUnitUserStatsGateway,
} from "@/features/units/gateways/unit-user-stats-gateway"
import {
  resetUnitYardGateway,
  setUnitYardGateway,
} from "@/features/units/gateways/unit-yard-gateway"
import {
  resetUnitsGateway,
  setUnitsGateway,
} from "@/features/units/gateways/units-gateway"
import { UnitUsersRoute } from "@/features/units/routes/unit-users-route"
import { UnitsRoute } from "@/features/units/routes/units-route"

beforeEach(() => {
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
  setUnitsGateway({
    findUnitById: (unitId) =>
      Promise.resolve(unitId === unitRow.cod_empresa ? unitRow : null),
    listUnits: () => Promise.resolve([unitRow]),
  })
  setUnitUserStatsGateway({
    async listStats() {
      await Promise.resolve()
      return [{ managers: 1, operators: 1, unit_id: 1 }]
    },
  })
  setUnitYardGateway({
    findConfigByUnitId: () => Promise.resolve(null),
    listConfigs: () => Promise.resolve([]),
  })
})

afterEach(() => {
  resetUnitsGateway()
  resetUnitUserStatsGateway()
  resetUnitYardGateway()
})

describe("Unit users route", () => {
  it("navigates from units row action and renders users list header", async () => {
    render(
      <MemoryRouter initialEntries={["/unidades"]}>
        <Routes>
          <Route path="/unidades" element={<UnitsRoute />} />
          <Route
            path="/unidades/:cod_empresa/usuarios"
            element={<UnitUsersRoute />}
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Monte Carlo Centro")).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole("button", {
        name: "Funcionários: Monte Carlo Centro",
      })
    )

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Monte Carlo Centro" })
      ).toBeInTheDocument()
    })

    expect(screen.getByText("Posto Monte Carlo Centro Ltda")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Monte Carlo Centro" })).toBeInTheDocument()
  }, 15_000)

})
