import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"

import {
  ClientsRoute,
  ClientVehiclesRoute,
} from "@/features/clients"

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
    expect(screen.getByRole("button", { name: "Historico" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sincronizar" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa Ltda")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])

    const vehiclesMenuItem = await screen.findByText("Veiculos")
    fireEvent.click(vehiclesMenuItem)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Auto Center Alfa Ltda" })
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole("heading", { name: "Auto Center Alfa Ltda" })
    ).toBeInTheDocument()
    expect(screen.getByText("ABC1D23")).toBeInTheDocument()
  })
})
