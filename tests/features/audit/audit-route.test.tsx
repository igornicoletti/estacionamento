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
      screen.getByRole("button", { name: "Exportar" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Monte Carlo Sul")).toBeInTheDocument()
    })
  })

  it("opens event details from the responsible column", async () => {
    render(<AuditRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Rede Monte Carlo",
    })

    fireEvent.click(trigger)

    expect(screen.getByText("Identificador do evento")).toBeInTheDocument()
    expect(screen.getByText("Endereço IP")).toBeInTheDocument()
  })
})
