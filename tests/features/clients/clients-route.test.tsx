import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"

import { ClientVehiclesRoute } from "@/features/clients/routes/client-vehicles-route"
import { ClientsRoute } from "@/features/clients/routes/clients-route"
import { setClientsGateway } from "@/features/clients/gateways/clients-gateway"

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
    expect(
      screen.getByRole("button", { name: "Histórico" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Sincronizar" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa Ltda")).toBeInTheDocument()
    })

    fireEvent.pointerDown(
      screen.getAllByRole("button", { name: "Abrir ações da linha" })[0]
    )

    const vehiclesMenuItem = await screen.findByText("Exibir veículos")
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

  it("distinguishes an unavailable client from an empty vehicle list", async () => {
    setClientsGateway({
      findClientById: () => Promise.resolve(null),
      listClients: () => Promise.resolve([]),
      listVehiclesByClientId: () => Promise.resolve([]),
    })

    render(
      <MemoryRouter initialEntries={["/clientes/9999"]}>
        <Routes>
          <Route path="/clientes/:cod_pessoa" element={<ClientVehiclesRoute />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getAllByText("Cliente não encontrado").length
      ).toBeGreaterThan(0)
    })
    expect(
      screen.queryByText("Nenhum veículo encontrado")
    ).not.toBeInTheDocument()
  })
})
