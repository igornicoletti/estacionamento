import { render, screen, waitFor } from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { PricesRoute, type PriceTable } from "@/features/prices"

const { listPriceTablesMock } = vi.hoisted(() => ({
  listPriceTablesMock: vi.fn<() => Promise<PriceTable[]>>(),
}))

vi.mock("@/features/prices/services/prices-service", () => ({
  listPriceTables: listPriceTablesMock,
  savePriceTable: vi.fn(),
}))

describe("PricesRoute", () => {
  beforeEach(() => {
    listPriceTablesMock.mockResolvedValue([
      {
        amount: 25,
        computedStatus: "active",
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
        tiers: [],
        toleranceMinutes: 10,
        unitId: null,
        unitName: null,
        updatedAt: "2026-07-02T12:00:00.000Z",
        version: 1,
      },
    ])
  })

  it("renders price tables with reusable data table controls", async () => {
    render(<PricesRoute />)

    expect(screen.getByRole("heading", { name: "Preços" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText("Buscar tabelas de preço...")).toBeInTheDocument()
    expect(screen.getByText("Rede")).toBeInTheDocument()
    expect(screen.getByText("24 horas")).toBeInTheDocument()
    expect(screen.getByText("15 min")).toBeInTheDocument()
  })
})
