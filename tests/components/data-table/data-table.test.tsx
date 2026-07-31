import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableSensitiveValue } from "@/components/data-table/data-table-sensitive-value"
import { DataTableTextAction } from "@/components/data-table/data-table-text-action"
import { createTextColumn } from "@/components/data-table/data-table-text-column"
import {
  type DataTableFilterField,
  type DataTableGlobalSearch,
} from "@/components/data-table/data-table-types"

interface TestRow {
  id: string
  name: string
  status: "active" | "inactive"
}

const rows: TestRow[] = [
  { id: "row-1", name: "Alpha", status: "active" },
  { id: "row-2", name: "Beta", status: "inactive" },
]

const columns = [
  createTextColumn<TestRow>({
    accessorKey: "name",
    title: "Nome",
  }),
  createTextColumn<TestRow>({
    accessorKey: "status",
    title: "Status",
  }),
]

const globalSearch = {
  columnIds: ["name"],
  placeholder: "Buscar linhas...",
} satisfies DataTableGlobalSearch<TestRow>

const filterFields = [
  {
    id: "status",
    title: "Status",
    options: [
      { label: "Ativo", value: "active", count: 1 },
      { label: "Inativo", value: "inactive", count: 1 },
    ],
    countSource: "options",
  },
] satisfies readonly DataTableFilterField<TestRow>[]

function expectResultCount(value: string) {
  expect(
    document.querySelector('[data-slot="data-table-result-count"]')
  ).toHaveTextContent(value)
}

describe("DataTable", () => {
  it("renders the default empty state when there are no rows", () => {
    render(
      <DataTable columns={columns} data={[]} getRowId={(row) => row.id} />
    )

    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument()
  })

  it("keeps the empty state inside the table shell", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} getRowId={(row) => row.id} />
    )

    expect(container.querySelector('[data-slot="empty"]')).not.toBeNull()
  })

  it("keeps the toolbar visible and hides the table on an initial empty state", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        globalSearch={globalSearch}
      />
    )

    expect(screen.getByLabelText("Buscar linhas...")).toBeInTheDocument()
    expectResultCount("0 resultados")
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders a filtered empty state without table or pagination", () => {
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
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.queryByText("Linhas por página")).not.toBeInTheDocument()
    expectResultCount("0 resultados")
  })

  it("renders rows and recovers from a filtered empty state", async () => {
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
    expectResultCount("2 resultados")
    expect(screen.queryByText("Filtros e ações")).not.toBeInTheDocument()
    expect(screen.queryByText("Registros")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Buscar linhas..."), {
      target: { value: "missing" },
    })

    await waitFor(() => {
      expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument()
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
      expectResultCount("0 resultados")
    })

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }))

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument()
      expect(screen.getByText("Beta")).toBeInTheDocument()
      expectResultCount("2 resultados")
    })
  })

  it("adds a filter and reflects selection, count, clear and removal states", async () => {
    const { baseElement } = render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        filterFields={filterFields}
        enableViewOptions={false}
        enableExport={false}
      />
    )

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Abrir filtros da tabela" }),
      { button: 0, ctrlKey: false, pointerType: "mouse" }
    )
    fireEvent.click(await screen.findByRole("menuitem", { name: "Status" }))

    const statusFilter = await screen.findByRole("combobox", {
      name: "Filtrar por Status",
    })
    expect(statusFilter).toHaveTextContent("Status")
    expect(
      screen.queryByRole("button", { name: "Limpar filtro: Status" })
    ).not.toBeInTheDocument()

    if (statusFilter.getAttribute("aria-expanded") !== "true") {
      fireEvent.click(statusFilter)
    }

    expect(
      await screen.findByRole("combobox", { name: "Buscar em Status" })
    ).toBeInTheDocument()

    const inactiveOption = await waitFor(() => {
      const items = Array.from(
        baseElement.querySelectorAll('[data-slot="combobox-item"]')
      )
      const item = items.find((candidate) =>
        candidate.textContent?.includes("Inativo")
      )
      expect(item).toBeDefined()
      return item as HTMLElement
    })

    expect(inactiveOption).toHaveTextContent("1")
    expect(inactiveOption).not.toHaveAttribute("aria-selected", "true")

    fireEvent.click(inactiveOption)

    await waitFor(() => {
      expect(statusFilter).toHaveTextContent("Inativo")
      expectResultCount("1 resultado")
    })

    if (statusFilter.getAttribute("aria-expanded") !== "true") {
      fireEvent.click(statusFilter)
    }

    await waitFor(() => {
      const selectedItem = Array.from(
        baseElement.querySelectorAll('[data-slot="combobox-item"]')
      ).find((candidate) => candidate.textContent?.includes("Inativo"))

      expect(selectedItem).toHaveAttribute("aria-selected", "true")
    })

    fireEvent.click(
      await screen.findByRole("button", { name: "Limpar filtro: Status" })
    )

    await waitFor(() => {
      expect(statusFilter).toHaveTextContent("Status")
      expectResultCount("2 resultados")
      expect(
        screen.queryByRole("button", { name: "Limpar filtro: Status" })
      ).not.toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole("button", { name: "Remover filtro: Status" })
    )

    await waitFor(() => {
      expect(
        screen.queryByRole("combobox", { name: "Filtrar por Status" })
      ).not.toBeInTheDocument()
    })
  })

  it("omits the toolbar when the table has no toolbar capabilities", () => {
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
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
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

  it("uses the low-noise table text action style", () => {
    render(<DataTableTextAction>Ver detalhes</DataTableTextAction>)

    const action = screen.getByRole("button", { name: "Ver detalhes" })

    expect(action).toHaveClass("text-foreground")
    expect(action).toHaveClass("hover:text-muted-foreground")
    expect(action).not.toHaveClass("text-primary")
    expect(action).not.toHaveClass("hover:underline")
  })

  it("masks sensitive values by default", () => {
    render(<DataTableSensitiveValue value="111.444.777-35" kind="cpf" />)

    expect(screen.getByText("***.***.***-**")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("formats raw CNPJ values before masking and explicit reveal", () => {
    render(
      <DataTableSensitiveValue
        value="22111333000144"
        kind="cpfCnpj"
        canReveal
        maskMode="partial"
      />
    )

    const value = screen.getByRole("button", {
      name: "Mantenha pressionado para exibir o conteúdo completo",
    })

    expect(value).toHaveTextContent("**.***.***/****-44")

    fireEvent.pointerDown(value, {
      button: 0,
      isPrimary: true,
      pointerId: 1,
    })
    expect(value).toHaveTextContent("22.111.333/0001-44")

    fireEvent.pointerUp(value, { pointerId: 1 })
    expect(value).toHaveTextContent("**.***.***/****-44")
  })
})
