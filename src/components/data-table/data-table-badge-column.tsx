import { type ColumnDef, type Row } from "@tanstack/react-table"
import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { type DataTableAccessorKey } from "./data-table-types"

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
  accessorKey: DataTableAccessorKey<TData>
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
    const normalized = value.trim()
    return normalized ? normalized : null
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  return null
}

function hasRenderableFallback(value: React.ReactNode): boolean {
  if (value === null || value === undefined || typeof value === "boolean") {
    return false
  }
  if (typeof value === "string") return value.trim().length > 0
  if (typeof value === "number") return Number.isFinite(value)
  return true
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
    meta: { label: title },
    header: createDataTableColumnHeader<TData, unknown>(title, {
      align: "center",
    }),
    cell: ({ getValue, row }) => {
      const rawValue = getValue()
      const value = normalizeBadgeValue(
        formatValue ? formatValue(rawValue, row) : rawValue
      )

      if (value === null) {
        const resolvedFallback =
          typeof fallback === "function" ? fallback(row) : fallback
        return hasRenderableFallback(resolvedFallback) ? (
          <div className="flex min-w-0 justify-center">
            {resolvedFallback}
          </div>
        ) : null
      }

      const resolvedVariant =
        typeof variant === "function" ? variant(value, row) : variant
      const resolvedClassName =
        typeof badgeClassName === "function"
          ? badgeClassName(value, row)
          : badgeClassName

      return (
        <div className="flex min-w-0 justify-center">
          <Badge
            variant={resolvedVariant}
            className={cn(
              "max-w-full justify-center text-center",
              resolvedClassName
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
