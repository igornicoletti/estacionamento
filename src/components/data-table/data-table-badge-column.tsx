import { type ColumnDef, type Row } from "@tanstack/react-table"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { type DataTableColumnId } from "./data-table-types"

export type DataTableBadgeValue = string | number

type DataTableBadgeVariant = NonNullable<
  React.ComponentProps<typeof Badge>["variant"]
>

type DataTableBadgeFallback<TData> =
  | React.ReactNode
  | ((row: Row<TData>) => React.ReactNode)

type DataTableBadgeVariantResolver<TData> =
  | DataTableBadgeVariant
  | ((value: DataTableBadgeValue, row: Row<TData>) => DataTableBadgeVariant)

type DataTableBadgeClassNameResolver<TData> =
  | string
  | ((value: DataTableBadgeValue, row: Row<TData>) => string | undefined)

interface DataTableBadgeColumnConfig<TData> {
  accessorKey: DataTableColumnId<TData>
  title: string
  fallback?: DataTableBadgeFallback<TData>
  formatValue?: (
    value: unknown,
    row: Row<TData>
  ) => DataTableBadgeValue | null | undefined
  variant?: DataTableBadgeVariantResolver<TData>
  badgeClassName?: DataTableBadgeClassNameResolver<TData>
  enableHiding?: boolean
  enableSorting?: boolean
}

function normalizeBadgeValue(value: unknown): DataTableBadgeValue | null {
  if (typeof value === "string") {
    const normalizedValue = value.trim()

    return normalizedValue.length > 0 ? normalizedValue : null
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  return null
}

function hasRenderableFallback(value: React.ReactNode): boolean {
  if (value === null || value === undefined || typeof value === "boolean") {
    return false
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
  }

  return true
}

function resolveFallback<TData>(
  fallback: DataTableBadgeFallback<TData>,
  row: Row<TData>
): React.ReactNode {
  return typeof fallback === "function" ? fallback(row) : fallback
}

export function createBadgeColumn<TData>({
  accessorKey,
  title,
  fallback = null,
  formatValue,
  variant = "outline",
  badgeClassName,
  enableHiding = true,
  enableSorting = false,
}: DataTableBadgeColumnConfig<TData>): ColumnDef<TData> {
  return {
    accessorKey,
    meta: {
      label: title,
    },
    header: createDataTableColumnHeader<TData, unknown>(title, {
      align: "center",
    }),
    cell: ({ getValue, row }) => {
      const rawValue = getValue()
      const formattedValue = formatValue
        ? formatValue(rawValue, row)
        : rawValue
      const value = normalizeBadgeValue(formattedValue)

      if (value === null) {
        const resolvedFallback = resolveFallback(fallback, row)

        if (!hasRenderableFallback(resolvedFallback)) {
          return null
        }

        return (
          <div className="flex min-w-0 justify-center">
            {resolvedFallback}
          </div>
        )
      }

      const resolvedVariant =
        typeof variant === "function" ? variant(value, row) : variant
      const resolvedBadgeClassName =
        typeof badgeClassName === "function"
          ? badgeClassName(value, row)
          : badgeClassName

      return (
        <div className="flex min-w-0 justify-center">
          <Badge
            variant={resolvedVariant}
            className={cn(
              "max-w-full justify-center text-center",
              resolvedBadgeClassName
            )}
          >
            {value}
          </Badge>
        </div>
      )
    },
    enableHiding,
    enableSorting,
  }
}
