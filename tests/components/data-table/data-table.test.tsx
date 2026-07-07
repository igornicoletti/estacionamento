import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import { createTextColumn } from "@/components/data-table/data-table-text-column"
import { type DataTableGlobalSearch } from "@/components/data-table/data-table-types"

interface TestRow {
  id: string
  name: string
}

const rows: TestRow[] = [
  { id: "row-1", name: "Alpha" },
  { id: "row-2", name: "Beta" },
]

const columns = [
  createTextColumn<TestRow>({
    accessorKey: "name",
    title: "Nome",
  }),
]

const globalSearch = {
  columnIds: ["name"],
  placeholder: "Buscar linhas...",
} satisfies DataTableGlobalSearch<TestRow>

describe("DataTable", () => {
  it("renders the default empty state when there are no rows", () => {
    render(
      <DataTable columns={columns} data={[]} getRowId={(row) => row.id} />
    )

    expect(screen.getByText("Nenhum registro encontrado.")).toBeInTheDocument()
  })

  it("keeps the empty state anchored to the visible scroll viewport", () => {
    render(
      <DataTable columns={columns} data={[]} getRowId={(row) => row.id} />
    )

    let current: HTMLElement | null = screen.getByText("Nenhum registro encontrado.")

    while (current && !String(current.className).includes("sticky left-0")) {
      current = current.parentElement
    }

    expect(current).toBeTruthy()
  })

  it("renders a filtered empty state when manual filtering receives no visible rows", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        globalSearch={globalSearch}
        globalFilterValue="missing"
        manualFiltering
        sourceRowCount={rows.length}
      />
    )

    expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()
  })

  it("renders rows and recovers from a filtered empty state", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        globalSearch={globalSearch}
      />
    )

    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("Beta")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Buscar linhas..."), {
      target: { value: "missing" },
    })

    expect(screen.getByText("Nenhum resultado encontrado.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }))

    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("Beta")).toBeInTheDocument()
  })

  it("uses the provided empty states for business-specific scenarios", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        emptyState={<div>Sem registros customizados</div>}
        filteredEmptyState={<div>Sem resultados filtrados customizados</div>}
        globalSearch={globalSearch}
      />
    )

    fireEvent.change(screen.getByLabelText("Buscar linhas..."), {
      target: { value: "missing" },
    })

    expect(
      screen.getByText("Sem resultados filtrados customizados")
    ).toBeInTheDocument()
  })

  it("preserves spaces while typing in the global search input", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        globalSearch={globalSearch}
      />
    )

    const searchInput = screen.getByLabelText("Buscar linhas...")

    fireEvent.change(searchInput, {
      target: { value: "Alpha " },
    })

    expect(searchInput).toHaveValue("Alpha ")
  })
})
