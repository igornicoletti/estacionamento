import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableSensitiveValue } from "@/components/data-table/data-table-sensitive-value"
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

    expect(screen.getByText("Nenhum registro cadastrado")).toBeInTheDocument()
  })

  it("keeps the empty state inside the table shell", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} getRowId={(row) => row.id} />
    )

    expect(container.querySelector('[data-slot="empty"]')).not.toBeNull()
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

    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument()
    expect(
      screen
        .getByText("Nenhum resultado encontrado")
        .closest('[data-slot="table-cell"]')
    ).toBeNull()
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
    expect(screen.getByRole("button", { name: /Filtros e ações/ })).toBeInTheDocument()
    expect(screen.queryByText("Registros")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Buscar linhas..."), {
      target: { value: "missing" },
    })

    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }))

    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("Beta")).toBeInTheDocument()
  })

  it("omits the controls block when the table has no toolbar capabilities", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        enableViewOptions={false}
        enableExport={false}
      />
    )

    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Filtros e ações/ })).not.toBeInTheDocument()
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

  it("reveals sensitive values only while pressed", () => {
    render(<DataTableSensitiveValue value="111.444.777-35" kind="cpf" />)

    const value = screen.getByRole("button", {
      name: "Segure para visualizar o conteúdo completo",
    })

    expect(value).toHaveTextContent("111.***.***-35")

    fireEvent.pointerDown(value)
    expect(value).toHaveTextContent("111.444.777-35")

    fireEvent.pointerUp(value)
    expect(value).toHaveTextContent("111.***.***-35")
  })

  it("formats raw CNPJ values before masking and revealing", () => {
    render(<DataTableSensitiveValue value="22111333000144" kind="cpfCnpj" />)

    const value = screen.getByRole("button", {
      name: "Segure para visualizar o conteúdo completo",
    })

    expect(value).toHaveTextContent("22.***.***/****-44")

    fireEvent.pointerDown(value)
    expect(value).toHaveTextContent("22.111.333/0001-44")

    fireEvent.pointerUp(value)
    expect(value).toHaveTextContent("22.***.***/****-44")
  })
})
