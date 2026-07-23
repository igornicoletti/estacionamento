import {
  type ColumnDef,
  type Row,
} from "@tanstack/react-table"
import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"

import { dataTableCopy } from "./data-table-copy"

type DataTableSelectColumnRowLabel<TData> =
  | string
  | ((row: Row<TData>) => string)

export interface DataTableSelectColumnConfig<TData> {
  /**
   * Largura fixa da coluna operacional.
   */
  size?: number

  /**
   * Bloqueia temporariamente todos os controles
   * visuais de seleção.
   *
   * A regra definitiva de seleção das linhas deve
   * continuar em table.options.enableRowSelection.
   */
  disabled?: boolean

  /**
   * Explicação geral usada quando disabled=true.
   */
  disabledReason?: string

  /**
   * Nome acessível do checkbox do cabeçalho.
   */
  headerLabel?: string

  /**
   * Nome acessível do checkbox de cada linha.
   *
   * Prefira uma função contextual, por exemplo:
   * "Selecionar cliente Empresa X".
   */
  rowLabel?: DataTableSelectColumnRowLabel<TData>

  /**
   * Explicação específica quando a linha não pode
   * ser selecionada.
   */
  getRowDisabledReason?: (
    row: Row<TData>
  ) => string | undefined
}

interface DataTableRowSelectionCheckboxProps<TData> {
  row: Row<TData>
  label: string
  disabled: boolean
  disabledReason?: string
}

const DEFAULT_SELECT_COLUMN_SIZE = 48

function normalizeVisibleText(
  value: string | undefined
): string {
  return (
    value
      ?.trim()
      .replace(/\s+/gu, " ") ?? ""
  )
}

function normalizeColumnSize(
  value: number | undefined
): number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  )
    ? value
    : DEFAULT_SELECT_COLUMN_SIZE
}

function resolveCheckboxState(
  isAllSelected: boolean,
  isSomeSelected: boolean
): boolean | "indeterminate" {
  if (isAllSelected) {
    return true
  }

  if (isSomeSelected) {
    return "indeterminate"
  }

  return false
}

function resolveRowLabel<TData>(
  row: Row<TData>,
  rowLabel:
    | DataTableSelectColumnRowLabel<TData>
    | undefined
): string {
  const resolvedLabel =
    typeof rowLabel === "function"
      ? rowLabel(row)
      : rowLabel

  return (
    normalizeVisibleText(resolvedLabel) ||
    dataTableCopy.accessibility.selectRow
  )
}

function DataTableRowSelectionCheckbox<TData>({
  row,
  label,
  disabled,
  disabledReason,
}: DataTableRowSelectionCheckboxProps<TData>) {
  const descriptionId = React.useId()

  const normalizedDisabledReason =
    normalizeVisibleText(disabledReason)

  const checked = resolveCheckboxState(
    row.getIsSelected(),
    row.getIsSomeSelected()
  )

  return (
    <div
      className="flex w-full items-center justify-center"
      title={
        disabled &&
          normalizedDisabledReason
          ? normalizedDisabledReason
          : undefined
      }
    >
      <Checkbox
        data-no-drag-scroll="true"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        aria-describedby={
          disabled &&
            normalizedDisabledReason
            ? descriptionId
            : undefined
        }
        onCheckedChange={(value) => {
          if (disabled) {
            return
          }

          row.toggleSelected(
            value === true
          )
        }}
        onClick={(event) => {
          event.stopPropagation()
        }}
      />

      {disabled &&
        normalizedDisabledReason ? (
        <span
          id={descriptionId}
          className="sr-only"
        >
          {normalizedDisabledReason}
        </span>
      ) : null}
    </div>
  )
}

export function createSelectColumn<TData>({
  size,
  disabled = false,
  disabledReason,
  headerLabel,
  rowLabel,
  getRowDisabledReason,
}: DataTableSelectColumnConfig<TData> = {}): ColumnDef<TData> {
  const resolvedSize =
    normalizeColumnSize(size)

  const resolvedHeaderLabel =
    normalizeVisibleText(headerLabel) ||
    dataTableCopy.accessibility
      .selectPageRows

  const normalizedGlobalDisabledReason =
    normalizeVisibleText(disabledReason)

  return {
    id: "select",

    header: ({ table }) => {
      const hasSelectablePageRows =
        table
          .getPaginationRowModel()
          .flatRows
          .some((row) =>
            row.getCanSelect()
          )

      const isDisabled =
        disabled ||
        !hasSelectablePageRows

      const checked =
        resolveCheckboxState(
          table.getIsAllPageRowsSelected(),
          table.getIsSomePageRowsSelected()
        )

      return (
        <div
          className="flex w-full items-center justify-center"
          title={
            isDisabled &&
              normalizedGlobalDisabledReason
              ? normalizedGlobalDisabledReason
              : undefined
          }
        >
          <Checkbox
            data-no-drag-scroll="true"
            checked={checked}
            disabled={isDisabled}
            aria-label={
              resolvedHeaderLabel
            }
            onCheckedChange={(value) => {
              if (isDisabled) {
                return
              }

              table.toggleAllPageRowsSelected(
                value === true
              )
            }}
            onClick={(event) => {
              event.stopPropagation()
            }}
          />
        </div>
      )
    },

    cell: ({ row }) => {
      const canSelect =
        row.getCanSelect()

      const isDisabled =
        disabled || !canSelect

      const specificDisabledReason =
        getRowDisabledReason?.(row)

      const resolvedDisabledReason =
        normalizeVisibleText(
          specificDisabledReason
        ) ||
        normalizedGlobalDisabledReason ||
        undefined

      return (
        <DataTableRowSelectionCheckbox
          row={row}
          label={resolveRowLabel(
            row,
            rowLabel
          )}
          disabled={isDisabled}
          disabledReason={
            resolvedDisabledReason
          }
        />
      )
    },

    enableSorting: false,
    enableHiding: false,
    enableResizing: false,

    meta: {
      enableExport: false,
    },

    size: resolvedSize,
    minSize: resolvedSize,
    maxSize: resolvedSize,
  }
}
