import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { setAuditGateway } from "@/features/audit/gateways/audit-gateway"
import { AuditRoute } from "@/features/audit/routes/audit-route"
import {
  createAuditEventRow,
  createMemoryAuditGateway,
} from "../../helpers/audit-memory-gateway"

describe("AuditRoute", () => {
  it("renders the audit header with the shared export menu", async () => {
    render(<AuditRoute />)

    expect(
      screen.getByRole("heading", { name: "Auditoria" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Rede Monte Carlo")).toBeInTheDocument()
    })

    const exportTrigger = screen.getByRole("button", {
      name: "Abrir menu de exportação",
    })
    expect(exportTrigger).toBeInTheDocument()

    fireEvent.pointerDown(exportTrigger)

    expect(
      await screen.findByRole("menuitem", {
        name: /Exportar registros carregados/i,
      })
    ).toBeInTheDocument()
  })

  it("opens event details from the responsible column", async () => {
    render(<AuditRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Rede Monte Carlo",
    })

    fireEvent.click(trigger)

    expect(await screen.findByText("Detalhes do evento")).toBeInTheDocument()
    expect(screen.getByText("ID do evento")).toBeInTheDocument()
    expect(screen.getByText("ID da solicitação")).toBeInTheDocument()
    expect(screen.getByText("req-test")).toBeInTheDocument()
    expect(screen.getAllByText("Escopo").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Motivo").length).toBeGreaterThan(0)
  })

  it("announces when older events are not loaded", async () => {
    setAuditGateway(
      createMemoryAuditGateway([createAuditEventRow()], {
        isTruncated: true,
      })
    )

    render(<AuditRoute />)

    expect(
      await screen.findByText(/Há registros anteriores que não estão carregados/)
    ).toBeInTheDocument()
  })

  it("shows a predictable error state and retries the real gateway", async () => {
    const listEvents = vi
      .fn()
      .mockRejectedValueOnce(new Error("backend unavailable"))
      .mockResolvedValueOnce({
        isTruncated: false,
        rows: [createAuditEventRow()],
      })
    setAuditGateway({ listEvents })

    render(<AuditRoute />)

    fireEvent.click(
      await screen.findByRole("button", { name: "Tentar novamente" })
    )

    expect(await screen.findByText("Rede Monte Carlo")).toBeInTheDocument()
    expect(listEvents).toHaveBeenCalledTimes(2)
  })
})
