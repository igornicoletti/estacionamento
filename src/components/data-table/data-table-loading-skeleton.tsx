import { type CSSProperties } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type DataTableSkeletonAlignment = "start" | "center" | "end"

interface DataTableLoadingSkeletonProps {
  columnCount: number
  rowCount: number
  columnSizes?: readonly number[]
  columnAlignments?: readonly DataTableSkeletonAlignment[]
  rowClassName?: string
}

const FALLBACK_WIDTH_PERCENTAGES = [72, 56, 84, 64] as const
const alignmentClassNames: Record<DataTableSkeletonAlignment, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
}

function normalizePositiveInteger(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : 0
}

function resolveSkeletonWidthStyle(
  columnIndex: number,
  columnSizes?: readonly number[]
): CSSProperties {
  const size = columnSizes?.[columnIndex]
  if (typeof size === "number" && Number.isFinite(size) && size > 0) {
    const availableWidth = Math.max(8, size - 16)
    const preferredWidth = Math.max(8, size * 0.68)
    return {
      width: `${Math.min(preferredWidth, availableWidth)}px`,
      maxWidth: "100%",
    }
  }

  return {
    width: `${FALLBACK_WIDTH_PERCENTAGES[columnIndex % FALLBACK_WIDTH_PERCENTAGES.length]}%`,
    maxWidth: "100%",
  }
}

export function DataTableLoadingSkeleton({
  columnCount,
  rowCount,
  columnSizes,
  columnAlignments,
  rowClassName,
}: DataTableLoadingSkeletonProps) {
  const safeColumnCount = normalizePositiveInteger(columnCount)
  const safeRowCount = normalizePositiveInteger(rowCount)
  if (!safeColumnCount || !safeRowCount) return null

  return (
    <>
      {Array.from({ length: safeRowCount }, (_, rowIndex) => (
        <TableRow
          key={`loading-row-${rowIndex}`}
          aria-hidden="true"
          className={cn("h-12", rowClassName)}
        >
          {Array.from({ length: safeColumnCount }, (_, columnIndex) => {
            const alignment = columnAlignments?.[columnIndex] ?? "start"
            return (
              <TableCell key={`loading-cell-${rowIndex}-${columnIndex}`}>
                <div className={cn("flex w-full", alignmentClassNames[alignment])}>
                  <Skeleton
                    className="h-5"
                    style={resolveSkeletonWidthStyle(columnIndex, columnSizes)}
                  />
                </div>
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}
