import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"

import {
  UnitUsersRoute,
  UnitsRoute,
} from "@/features/units"

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
    expect(screen.getByText("Carlos Oliveira")).toBeInTheDocument()
    expect(screen.getByText("Daniela Souza")).toBeInTheDocument()
  })

  it("navigates when clicking users count in units table", async () => {
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

    const usersCountButton = await screen.findByRole("button", {
      name: "Ver usuários da unidade Monte Carlo Centro",
    })
    fireEvent.click(usersCountButton)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Monte Carlo Centro" })
      ).toBeInTheDocument()
    })
  })
})
