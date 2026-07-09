import { render, screen, waitFor } from "@testing-library/react"
import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest"

import {
  createMemoryPricesGateway,
  PricesRoute,
  resetPricesGateway,
  setPricesGateway,
} from "@/features/prices"

afterEach(() => {
  resetPricesGateway()
})

describe("PricesRoute", () => {
  it("renders price tables with reusable data table controls", async () => {
    setPricesGateway(createMemoryPricesGateway([
      {
        amount: 25,
        cycleHours: 24,
        endsAt: null,
        graceMinutes: 15,
        id: "price-network",
        notes: "Tabela operacional vigente.",
        parentId: null,
        reason: "Configuração comercial validada.",
        scope: "network",
        startsAt: "2026-07-01T12:00:00.000Z",
        status: "active",
        computedStatus: "active",
        tiers: [],
        toleranceMinutes: 10,
        unitId: null,
        unitName: null,
        updatedAt: "2026-07-02T12:00:00.000Z",
        version: 1,
      },
    ]))

    render(<PricesRoute />)

    expect(screen.getByRole("heading", { name: "Preços" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText("Buscar tabelas de preço...")).toBeInTheDocument()
    expect(screen.getByText("Padrão da rede")).toBeInTheDocument()
    expect(screen.getByText("24h")).toBeInTheDocument()
    expect(screen.getByText("15 min")).toBeInTheDocument()
  })
})
