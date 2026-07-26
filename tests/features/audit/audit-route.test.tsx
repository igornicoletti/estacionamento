import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AuditRoute } from "@/features/audit"

describe("AuditRoute", () => {
  it("renders the audit header with an export action", async () => {
    render(<AuditRoute />)

    expect(
      screen.getByRole("heading", { name: "Auditoria" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Exportar tudo" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Rede Monte Carlo")).toBeInTheDocument()
    })
  })

  it("opens event details from the responsible column", async () => {
    render(<AuditRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Rede Monte Carlo",
    })

    fireEvent.click(trigger)

    expect(await screen.findByText("Detalhes do evento")).toBeInTheDocument()
    expect(screen.getAllByText("Escopo").length).toBeGreaterThan(0)
    expect(screen.getByText("Motivo")).toBeInTheDocument()
  })
})
