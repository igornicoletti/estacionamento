import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import { createTextColumn } from "@/components/data-table/data-table-text-column"
import { type DataTableGlobalSearch } from "@/components/data-table/data-table-types"
import * as exportModule from "@/lib/export"

interface ExportTestRow {
  id: string
  name: string
  status: string
  secret: string
}

const exportRows: ExportTestRow[] = [
  { id: "row-1", name: "Alpha", status: "Ativo", secret: "A1" },
  { id: "row-2", name: "Beta", status: "Inativo", secret: "B2" },
  { id: "row-3", name: "Gamma", status: "Ativo", secret: "C3" },
]

const exportColumns = [
  createTextColumn<ExportTestRow>({
    accessorKey: "name",
    title: "Nome",
  }),
  createTextColumn<ExportTestRow>({
    accessorKey: "status",
    title: "Status",
  }),
  createTextColumn<ExportTestRow>({
    accessorKey: "secret",
    title: "Segredo",
  }),
]

const exportSearch = {
  columnIds: ["name", "status"],
  placeholder: "Buscar linhas...",
} satisfies DataTableGlobalSearch<ExportTestRow>

describe("DataTable export", () => {
  beforeEach(() => {
    vi.spyOn(exportModule, "exportRowsToXlsx").mockImplementation(() => new Blob())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("exports the loaded table dataset instead of only the visible page", () => {
    const exportRowsToXlsxMock = vi.mocked(exportModule.exportRowsToXlsx)

    render(
      <DataTable
        columns={exportColumns}
        data={exportRows}
        getRowId={(row) => row.id}
        initialPageSize={1}
        enableViewOptions={false}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Exportar" }))

    expect(exportRowsToXlsxMock).toHaveBeenCalledTimes(1)
    expect(exportRowsToXlsxMock.mock.calls[0]?.[0].rows).toEqual([
      { name: "Alpha", status: "Ativo", secret: "A1" },
      { name: "Beta", status: "Inativo", secret: "B2" },
      { name: "Gamma", status: "Ativo", secret: "C3" },
    ])
  })

  it("exports filtered rows and excludes hidden columns", async () => {
    const exportRowsToXlsxMock = vi.mocked(exportModule.exportRowsToXlsx)

    render(
      <DataTable
        columns={exportColumns}
        data={exportRows}
        getRowId={(row) => row.id}
        defaultColumnVisibility={{ secret: false }}
        enableViewOptions={false}
        globalSearch={exportSearch}
      />
    )

    fireEvent.change(screen.getByLabelText("Buscar linhas..."), {
      target: { value: "Beta" },
    })

    await waitFor(() => {
      expect(screen.queryByText("Alpha")).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Exportar" }))

    const exportOptions = exportRowsToXlsxMock.mock.calls[0]?.[0]

    expect(exportOptions.columns.map((column: { header: string }) => column.header)).toEqual([
      "Nome",
      "Status",
    ])
    expect(exportOptions.rows).toEqual([
      { name: "Beta", status: "Inativo" },
    ])
  })
})
