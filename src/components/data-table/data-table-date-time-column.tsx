import { type ColumnDef } from "@tanstack/react-table"

import { createDataTableColumnHeader } from "./data-table-column-header"
import {
  type DataTableAccessorKey,
  type DataTableColumnId,
} from "./data-table-types"

interface DataTableDateTimeColumnCommonConfig {
  title: string
  dateTimeFormat?: Intl.DateTimeFormatOptions
  locale?: string
  fallback?: string
  enableHiding?: boolean
  enableSorting?: boolean
  sortDescFirst?: boolean
}

type DataTableDateTimeColumnSource<TData> =
  | {
      accessorKey: DataTableAccessorKey<TData>
      getValue?: never
    }
  | {
      accessorKey: DataTableColumnId<TData>
      getValue: (row: TData) => unknown
    }

type DataTableDateTimeColumnConfig<TData> =
  DataTableDateTimeColumnCommonConfig &
    DataTableDateTimeColumnSource<TData>

const DEFAULT_DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "short",
  timeStyle: "short",
}

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null
    }

    const date = new Date(value)

    return Number.isFinite(date.getTime()) ? date : null
  }

  if (typeof value === "string") {
    const normalized = value.trim()

    if (normalized.length === 0) {
      return null
    }

    const date = new Date(normalized)

    return Number.isFinite(date.getTime()) ? date : null
  }

  return null
}

function resolveRawDateTimeValue<TData>(
  row: TData,
  source: DataTableDateTimeColumnSource<TData>
): unknown {
  if (source.getValue) {
    return source.getValue(row)
  }

  return row[source.accessorKey]
}

export function createDateTimeColumn<TData>(
  config: DataTableDateTimeColumnConfig<TData>
): ColumnDef<TData> {
  const {
    accessorKey,
    title,
    dateTimeFormat = DEFAULT_DATE_TIME_FORMAT,
    locale = "pt-BR",
    fallback = "—",
    enableHiding = true,
    enableSorting = true,
    sortDescFirst,
  } = config

  const formatter = new Intl.DateTimeFormat(locale, dateTimeFormat)
  const columnId = String(accessorKey)

  return {
    id: columnId,
    accessorFn: (row) => toValidDate(resolveRawDateTimeValue(row, config)),
    meta: {
      label: title,
      exportValue: (value) => {
        const date = toValidDate(value)

        return date ? date.toISOString() : null
      },
    },
    header: createDataTableColumnHeader<TData, Date | null>(title),
    cell: ({ getValue }) => {
      const date = toValidDate(getValue())

      return date ? (
        <time dateTime={date.toISOString()}>{formatter.format(date)}</time>
      ) : (
        fallback
      )
    },
    enableHiding,
    enableSorting,
    sortingFn: "datetime",
    sortDescFirst,
    sortUndefined: "last",
  }
}
