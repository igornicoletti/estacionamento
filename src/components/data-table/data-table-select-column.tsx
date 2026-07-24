import { type ColumnDef, type Row } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

import { dataTableCopy } from "./data-table-copy"

type DataTableSelectColumnRowLabel<TData> =
  | string
  | ((row: Row<TData>) => string)

export interface DataTableSelectColumnConfig<TData> {
  size?: number
  disabled?: boolean
  disabledReason?: string
  headerLabel?: string
  rowLabel?: DataTableSelectColumnRowLabel<TData>
  getRowDisabledReason?: (row: Row<TData>) => string | undefined
}

const DEFAULT_SELECT_COLUMN_SIZE = 48

function normalizeVisibleText(value: string | undefined): string {
  return value?.trim().replace(/\s+/gu, " ") ?? ""
}

function normalizeColumnSize(value: number | undefined): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : DEFAULT_SELECT_COLUMN_SIZE
}

function resolveCheckboxState(
  allSelected: boolean,
  someSelected: boolean
): boolean | "indeterminate" {
  if (allSelected) return true
  if (someSelected) return "indeterminate"
  return false
}

function resolveRowLabel<TData>(
  row: Row<TData>,
  rowLabel: DataTableSelectColumnRowLabel<TData> | undefined
): string {
  const label = typeof rowLabel === "function" ? rowLabel(row) : rowLabel
  return normalizeVisibleText(label) || dataTableCopy.accessibility.selectRow
}

export function createSelectColumn<TData>({
  size,
  disabled = false,
  disabledReason,
  headerLabel,
  rowLabel,
  getRowDisabledReason,
}: DataTableSelectColumnConfig<TData> = {}): ColumnDef<TData> {
  const resolvedSize = normalizeColumnSize(size)
  const resolvedHeaderLabel =
    normalizeVisibleText(headerLabel) ||
    dataTableCopy.accessibility.selectPageRows
  const globalDisabledReason = normalizeVisibleText(disabledReason)

  return {
    id: "select",
    header: ({ table }) => {
      const hasSelectablePageRows = table
        .getPaginationRowModel()
        .flatRows.some((row) => row.getCanSelect())
      const isDisabled = disabled || !hasSelectablePageRows

      return (
        <div
          className="flex w-full items-center justify-center"
          title={
            isDisabled && globalDisabledReason
              ? globalDisabledReason
              : undefined
          }
        >
          <Checkbox
            data-no-drag-scroll="true"
            checked={resolveCheckboxState(
              table.getIsAllPageRowsSelected(),
              table.getIsSomePageRowsSelected()
            )}
            disabled={isDisabled}
            aria-label={resolvedHeaderLabel}
            onCheckedChange={(value) => {
              if (!isDisabled) table.toggleAllPageRowsSelected(value === true)
            }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )
    },
    cell: ({ row }) => {
      const isDisabled = disabled || !row.getCanSelect()
      const reason =
        normalizeVisibleText(getRowDisabledReason?.(row)) ||
        globalDisabledReason ||
        undefined
      const descriptionId = `${row.id}-selection-disabled-reason`

      return (
        <div
          className="flex w-full items-center justify-center"
          title={isDisabled ? reason : undefined}
        >
          <Checkbox
            data-no-drag-scroll="true"
            checked={resolveCheckboxState(
              row.getIsSelected(),
              row.getIsSomeSelected()
            )}
            disabled={isDisabled}
            aria-label={resolveRowLabel(row, rowLabel)}
            aria-describedby={isDisabled && reason ? descriptionId : undefined}
            onCheckedChange={(value) => {
              if (!isDisabled) row.toggleSelected(value === true)
            }}
            onClick={(event) => event.stopPropagation()}
          />
          {isDisabled && reason ? (
            <span id={descriptionId} className="sr-only">
              {reason}
            </span>
          ) : null}
        </div>
      )
    },
    enableColumnFilter: false,
    enableGlobalFilter: false,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    meta: { enableExport: false },
    size: resolvedSize,
    minSize: resolvedSize,
    maxSize: resolvedSize,
  }
}
