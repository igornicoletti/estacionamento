import { type ColumnDef, type Row } from "@tanstack/react-table"
import * as React from "react"

import { type XlsxCellValue } from "@/lib/export"
import { cn } from "@/lib/utils"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { type DataTableAccessorKey } from "./data-table-types"

export interface DataTableTextBooleanLabels {
  true: string
  false: string
}

type DataTableTextFormatValue<TData> = (
  value: unknown,
  row: Row<TData>
) => React.ReactNode

type DataTableTextExportValue<TData> = (
  value: unknown,
  row: TData
) => XlsxCellValue

interface DataTableTextColumnBaseConfig<TData> {
  accessorKey: DataTableAccessorKey<TData>
  title: string
  className?: string
  fallback?: React.ReactNode
  booleanLabels?: DataTableTextBooleanLabels
  enableHiding?: boolean
  enableSorting?: boolean
  sortingFn?: ColumnDef<TData>["sortingFn"]
  sortDescFirst?: boolean
  sortUndefined?: ColumnDef<TData>["sortUndefined"]
}

type DataTableTextColumnWithoutFormatter<TData> =
  DataTableTextColumnBaseConfig<TData> & {
    formatValue?: undefined
    enableExport?: boolean
    exportValue?: DataTableTextExportValue<TData>
  }

type DataTableTextColumnFormattedExportable<TData> =
  DataTableTextColumnBaseConfig<TData> & {
    formatValue: DataTableTextFormatValue<TData>
    enableExport?: true
    exportValue: DataTableTextExportValue<TData>
  }

type DataTableTextColumnFormattedNotExportable<TData> =
  DataTableTextColumnBaseConfig<TData> & {
    formatValue: DataTableTextFormatValue<TData>
    enableExport: false
    exportValue?: never
  }

export type DataTableTextColumnConfig<TData> =
  | DataTableTextColumnWithoutFormatter<TData>
  | DataTableTextColumnFormattedExportable<TData>
  | DataTableTextColumnFormattedNotExportable<TData>

const DEFAULT_BOOLEAN_LABELS: DataTableTextBooleanLabels = {
  true: "Sim",
  false: "Não",
}

function normalizeVisibleText(value: string): string | null {
  const normalized = value.trim().normalize("NFC")
  return normalized ? normalized : null
}

export function normalizeDataTableTextValue(
  value: unknown,
  booleanLabels: DataTableTextBooleanLabels = DEFAULT_BOOLEAN_LABELS
): string | null {
  if (typeof value === "string") return normalizeVisibleText(value)
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null
  if (typeof value === "bigint") return String(value)
  if (typeof value === "boolean") {
    return normalizeVisibleText(value ? booleanLabels.true : booleanLabels.false)
  }
  return null
}

function hasRenderableContent(value: React.ReactNode): boolean {
  try {
    return React.Children.toArray(value).some((node) => {
      if (typeof node === "string") return node.trim().length > 0
      if (typeof node === "number") return Number.isFinite(node)
      return true
    })
  } catch {
    return false
  }
}

export function createTextColumn<TData>(
  config: DataTableTextColumnConfig<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    title,
    className,
    fallback = "—",
    booleanLabels = DEFAULT_BOOLEAN_LABELS,
    formatValue,
    enableExport = true,
    exportValue,
    enableHiding = true,
    enableSorting,
    sortingFn,
    sortDescFirst,
    sortUndefined = "last",
  } = config

  const resolvedEnableSorting = enableSorting ?? formatValue === undefined
  const defaultExportValue: DataTableTextExportValue<TData> = (value) =>
    normalizeDataTableTextValue(value, booleanLabels)

  return {
    accessorKey,
    meta: {
      label: title,
      enableExport,
      ...(enableExport
        ? { exportValue: exportValue ?? defaultExportValue }
        : {}),
    },
    header: createDataTableColumnHeader<TData, unknown>(title),
    cell: ({ getValue, row }) => {
      const rawValue = getValue()
      const formatted = formatValue
        ? formatValue(rawValue, row)
        : normalizeDataTableTextValue(rawValue, booleanLabels) ?? fallback
      const content = hasRenderableContent(formatted)
        ? formatted
        : hasRenderableContent(fallback)
          ? fallback
          : null

      return content === null ? null : (
        <div className={cn("min-w-0 max-w-full", className)}>{content}</div>
      )
    },
    enableHiding,
    enableSorting: resolvedEnableSorting,
    sortingFn,
    sortDescFirst,
    sortUndefined,
  }
}
