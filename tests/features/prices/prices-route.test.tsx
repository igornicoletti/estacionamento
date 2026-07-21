import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  PricesRoute,
  type PriceTable,
  type SavePriceTableInput,
} from "@/features/prices"

const {
  listPriceTablesMock,
  savePriceTableMock,
  updatePriceTableStatusMock,
} = vi.hoisted(() => ({
  listPriceTablesMock: vi.fn<() => Promise<PriceTable[]>>(),
  savePriceTableMock: vi.fn<(input: SavePriceTableInput) => Promise<void>>(),
  updatePriceTableStatusMock:
    vi.fn<(id: string, status: PriceTable["status"]) => Promise<void>>(),
}))

vi.mock("@/features/prices/services/prices-service", () => ({
  listPriceTables: listPriceTablesMock,
  savePriceTable: savePriceTableMock,
  updatePriceTableStatus: updatePriceTableStatusMock,
}))

describe("PricesRoute", () => {
  const activePrice: PriceTable = {
    amount: 25,
    cycleHours: 24,
    createdAt: null,
    endsAt: null,
    graceMinutes: 15,
    id: "price-global",
    name: "Tabela operacional",
    notes: "Tabela operacional vigente.",
    scope: "global",
    startsAt: "2026-07-01T12:00:00.000Z",
    status: "active",
    toleranceMinutes: 10,
    unitId: null,
    unitName: null,
    updatedAt: "2026-07-02T12:00:00.000Z",
  }

  beforeEach(() => {
    listPriceTablesMock.mockReset()
    savePriceTableMock.mockReset()
    updatePriceTableStatusMock.mockReset()
    listPriceTablesMock.mockResolvedValue([activePrice])
    savePriceTableMock.mockResolvedValue(undefined)
    updatePriceTableStatusMock.mockResolvedValue(undefined)
  })

  it("renders price tables with reusable data table controls", async () => {
    render(<PricesRoute />)

    expect(screen.getByRole("heading", { name: "Preços" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText("Buscar tabelas de preço...")).toBeInTheDocument()
    expect(screen.getByText("Rede")).toBeInTheDocument()
    expect(screen.getByText("Rede").closest("[data-slot='badge']")).toBeNull()
    expect(screen.getByText("24 horas")).toBeInTheDocument()
    expect(screen.getByText("15 min")).toBeInTheDocument()
  })

  it("validates required price fields before saving", async () => {
    render(<PricesRoute />)

    await waitFor(() => {
      expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Adicionar tabela de preço" })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(await screen.findByText("Informe um valor base válido.")).toBeInTheDocument()
    expect(savePriceTableMock).not.toHaveBeenCalled()
  })

  it("creates a global price table and closes the form on success", async () => {
    render(<PricesRoute />)

    await waitFor(() => {
      expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))
    fireEvent.change(screen.getByLabelText("Valor base"), {
      target: { value: "30,5" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(savePriceTableMock).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 30.5,
          scope: "global",
          status: "active",
        })
      )
    })
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Adicionar tabela de preço" })
      ).not.toBeInTheDocument()
    })
  })

  it("keeps the price form open with a sanitized error when save fails", async () => {
    savePriceTableMock.mockRejectedValueOnce(new Error("duplicate key value violates constraint"))

    render(<PricesRoute />)

    await waitFor(() => {
      expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))
    fireEvent.change(screen.getByLabelText("Valor base"), {
      target: { value: "30" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Adicionar tabela de preço" })).toBeInTheDocument()
    })
    expect(screen.queryByText(/duplicate key/i)).not.toBeInTheDocument()
  })

  it("requires AppAlertDialog confirmation before deactivating a price table", async () => {
    render(<PricesRoute />)

    await waitFor(() => {
      expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])
    fireEvent.click(await screen.findByRole("menuitem", { name: "Inativar" }))

    expect(screen.getByRole("heading", { name: "Inativar tabela de preço" })).toBeInTheDocument()
    expect(updatePriceTableStatusMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Inativar tabela" }))

    await waitFor(() => {
      expect(updatePriceTableStatusMock).toHaveBeenCalledWith("price-global", "inactive")
    })
  })
})
