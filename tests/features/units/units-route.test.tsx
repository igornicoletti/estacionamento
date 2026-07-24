import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { UnitsRoute } from "@/features/units"

describe("UnitsRoute", () => {
  it("renders units header and opens row details from first column", async () => {
    render(<UnitsRoute />)

    expect(screen.getByRole("heading", { name: "Unidades" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Histórico" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Monte Carlo Centro")).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Posto Monte Carlo Centro Ltda" })
    )

    expect(screen.getByText("Código da empresa")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Fechar" }).length).toBeGreaterThan(0)
  })
})
