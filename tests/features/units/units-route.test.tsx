import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { UnitsRoute } from "@/features/units"

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
    expect(screen.getAllByRole("button", { name: "Fechar" }).length).toBeGreaterThan(0)

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
  })
})
