import type * as React from "react"

import { cn } from "@/lib/utils"

import {
  DATA_TABLE_EMPTY_FILTER_VALUE,
  normalizeDataTableFilterValue,
} from "./data-table-filter-options"
import { type DataTableFilterOption } from "./data-table-types"

export type DataTableOptionCellFallbackReason =
  | "empty-value"
  | "unsupported-value"
  | "unknown-option"
  | "empty-label"

export interface DataTableOptionCellFallbackContext {
  reason: DataTableOptionCellFallbackReason
  value: unknown
  normalizedValue: string | null
  option: DataTableFilterOption | null
}

type DataTableOptionCellFallback =
  | React.ReactNode
  | ((context: DataTableOptionCellFallbackContext) => React.ReactNode)

interface DataTableOptionCellProps {
  options: readonly DataTableFilterOption[]
  value: unknown
  className?: string
  fallback?: DataTableOptionCellFallback
}

function isEmptyOptionValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0)
  )
}

function normalizeOptionLabel(label: string): string | null {
  const normalized = label.trim().replace(/\s+/gu, " ").normalize("NFC")
  return normalized ? normalized : null
}

function normalizeOptionValue(value: unknown): string | null {
  return normalizeDataTableFilterValue(value, DATA_TABLE_EMPTY_FILTER_VALUE)
}

export function findDataTableFilterOption(
  options: readonly DataTableFilterOption[],
  value: unknown
): DataTableFilterOption | null {
  const normalizedValue = normalizeOptionValue(value)
  return normalizedValue === null
    ? null
    : options.find((option) => option.value === normalizedValue) ?? null
}

function resolveFallbackReason(
  value: unknown,
  normalizedValue: string | null,
  option: DataTableFilterOption | null
): DataTableOptionCellFallbackReason {
  if (isEmptyOptionValue(value)) return "empty-value"
  if (normalizedValue === null) return "unsupported-value"
  if (!option) return "unknown-option"
  return "empty-label"
}

function resolveDefaultFallback(
  context: DataTableOptionCellFallbackContext
): React.ReactNode {
  return context.normalizedValue !== null &&
    context.normalizedValue !== DATA_TABLE_EMPTY_FILTER_VALUE
    ? context.normalizedValue
    : "—"
}

function renderCellContent(
  content: React.ReactNode,
  className: string | undefined
): React.ReactNode {
  if (content === null || content === undefined || typeof content === "boolean") {
    return null
  }

  if (
    typeof content === "string" ||
    typeof content === "number" ||
    typeof content === "bigint"
  ) {
    return <span className={cn("font-medium", className)}>{content}</span>
  }

  return content
}

export function DataTableOptionCell({
  options,
  value,
  className,
  fallback,
}: DataTableOptionCellProps) {
  const normalizedValue = normalizeOptionValue(value)
  const option =
    normalizedValue === null
      ? null
      : options.find((candidate) => candidate.value === normalizedValue) ?? null
  const normalizedLabel = option ? normalizeOptionLabel(option.label) : null

  if (option && normalizedLabel) {
    return <span className={cn("font-medium", className)}>{normalizedLabel}</span>
  }

  const context: DataTableOptionCellFallbackContext = {
    reason: resolveFallbackReason(value, normalizedValue, option),
    value,
    normalizedValue,
    option,
  }
  const resolvedFallback =
    fallback === undefined
      ? resolveDefaultFallback(context)
      : typeof fallback === "function"
        ? fallback(context)
        : fallback

  return renderCellContent(resolvedFallback, className)
}
