import {
  type ColumnDef,
  type SortingFn,
} from "@tanstack/react-table"
import { type ComponentProps } from "react"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { includesSelectedValue } from "./data-table-filter-fns"
import {
  DATA_TABLE_EMPTY_FILTER_VALUE,
  normalizeDataTableFilterValue,
} from "./data-table-filter-options"
import { normalizeSearchValue } from "./data-table-filter-utils"
import { DataTableOptionCell } from "./data-table-option-cell"
import {
  type DataTableColumnId,
  type DataTableFilterOption,
} from "./data-table-types"

type DataTableOptionCellFallback =
  ComponentProps<
    typeof DataTableOptionCell
  >["fallback"]

interface DataTableOptionColumnConfig<TData> {
  accessorKey: DataTableColumnId<TData>
  title: string
  options: readonly DataTableFilterOption[]
  className?: string
  cellFallback?: DataTableOptionCellFallback
  enableExport?: boolean
  enableHiding?: boolean
  enableSorting?: boolean
  sortingFn?: ColumnDef<TData>["sortingFn"]
  sortDescFirst?: boolean
  sortUndefined?: ColumnDef<TData>["sortUndefined"]
}

const optionLabelCollator = new Intl.Collator(
  "pt-BR",
  {
    numeric: true,
    sensitivity: "base",
  }
)

function createOptionIndex(
  options: readonly DataTableFilterOption[]
): ReadonlyMap<string, DataTableFilterOption> {
  const optionsByValue = new Map<
    string,
    DataTableFilterOption
  >()

  for (const option of options) {
    if (!optionsByValue.has(option.value)) {
      optionsByValue.set(
        option.value,
        option
      )
    }
  }

  return optionsByValue
}

function resolveOptionDisplayValue(
  value: unknown,
  optionsByValue: ReadonlyMap<
    string,
    DataTableFilterOption
  >
): string | null {
  const normalizedValue =
    normalizeDataTableFilterValue(
      value,
      DATA_TABLE_EMPTY_FILTER_VALUE
    )

  if (normalizedValue === null) {
    return null
  }

  const option =
    optionsByValue.get(normalizedValue)

  if (option) {
    const normalizedLabel =
      normalizeSearchValue(option.label)

    if (normalizedLabel.length > 0) {
      return normalizedLabel
    }
  }

  return normalizedValue ===
    DATA_TABLE_EMPTY_FILTER_VALUE
    ? null
    : normalizedValue
}

function normalizeSortingResult(
  result: number
): -1 | 0 | 1 {
  if (result < 0) {
    return -1
  }

  if (result > 0) {
    return 1
  }

  return 0
}

function createOptionLabelSortingFn<TData>(
  optionsByValue: ReadonlyMap<
    string,
    DataTableFilterOption
  >
): SortingFn<TData> {
  return (rowA, rowB, columnId) => {
    const leftValue =
      resolveOptionDisplayValue(
        rowA.getValue(columnId),
        optionsByValue
      )

    const rightValue =
      resolveOptionDisplayValue(
        rowB.getValue(columnId),
        optionsByValue
      )

    if (leftValue === rightValue) {
      return 0
    }

    if (leftValue === null) {
      return 1
    }

    if (rightValue === null) {
      return -1
    }

    return normalizeSortingResult(
      optionLabelCollator.compare(
        leftValue,
        rightValue
      )
    )
  }
}

export function createOptionColumn<TData>({
  accessorKey,
  title,
  options,
  className,
  cellFallback,
  enableExport = true,
  enableHiding = true,
  enableSorting = false,
  sortingFn,
  sortDescFirst,
  sortUndefined = "last",
}: DataTableOptionColumnConfig<TData>): ColumnDef<TData> {
  const optionsByValue =
    createOptionIndex(options)

  const optionLabelSortingFn =
    createOptionLabelSortingFn<TData>(
      optionsByValue
    )

  return {
    accessorKey,

    meta: {
      label: title,
      enableExport,

      exportValue: (value) =>
        resolveOptionDisplayValue(
          value,
          optionsByValue
        ),
    },

    header:
      createDataTableColumnHeader<
        TData,
        unknown
      >(title),

    cell: ({ getValue }) => (
      <DataTableOptionCell
        options={options}
        value={getValue()}
        className={className}
        fallback={cellFallback}
      />
    ),

    filterFn: includesSelectedValue,

    enableHiding,
    enableSorting,

    sortingFn:
      sortingFn ??
      optionLabelSortingFn,

    sortDescFirst,
    sortUndefined,
  }
}
