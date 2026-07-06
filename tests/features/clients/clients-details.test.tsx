import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { ClientsRoute } from "@/features/clients"

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

    fireEvent.click(
      screen.getByRole("button", { name: "Auto Center Alfa Ltda" })
    )

    expect(screen.getAllByText("Código do cliente").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("heading", { name: "Auto Center Alfa Ltda" })
    ).toBeInTheDocument()
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

    fireEvent.pointerDown(
      screen.getAllByRole("button", { name: "Abrir ações da linha" })[0]
    )

    fireEvent.click(await screen.findByRole("menuitem", { name: "Informações" }))

    expect(screen.getAllByText("Código do cliente").length).toBeGreaterThan(0)
  })
})
