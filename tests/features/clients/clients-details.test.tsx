import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { ClientsRoute } from "@/features/clients"
import { flushReactUpdates } from "../../helpers/flush-react-updates"

describe("ClientsRoute details", () => {
  it("opens details from the primary company name text", async () => {
    render(
      <MemoryRouter>
        <ClientsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa Ltda")).toBeInTheDocument()
    })
    await flushReactUpdates()

    fireEvent.click(
      screen.getByRole("button", { name: "Auto Center Alfa Ltda" })
    )

    expect(screen.getAllByText("Código do cliente").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("heading", { name: "Detalhes do cliente" })
    ).toBeInTheDocument()
    await flushReactUpdates()
  })

  it("opens details from the row actions menu", async () => {
    render(
      <MemoryRouter>
        <ClientsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Auto Center Alfa Ltda")).toBeInTheDocument()
    })
    await flushReactUpdates()

    fireEvent.pointerDown(
      screen.getAllByRole("button", { name: "Abrir ações da linha" })[0]
    )

    fireEvent.click(await screen.findByRole("menuitem", { name: "Detalhes" }))

    expect(screen.getAllByText("Código do cliente").length).toBeGreaterThan(0)
    await flushReactUpdates()
  })
})
