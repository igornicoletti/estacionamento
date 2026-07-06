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
  UnitUsersRoute,
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

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])

    const usersMenuItem = await screen.findByRole("menuitem", {
      name: "Usuários",
    })
    fireEvent.click(usersMenuItem)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Monte Carlo Centro" })
      ).toBeInTheDocument()
    })

    expect(screen.getByText("00.000.000/0001-00")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Monte Carlo Centro" })).toBeInTheDocument()
  }, 15_000)

})
