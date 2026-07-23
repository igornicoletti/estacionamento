import { type CSSProperties } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type DataTableSkeletonAlignment =
  | "start"
  | "center"
  | "end"

interface DataTableLoadingSkeletonProps {
  columnCount: number
  rowCount: number
  columnSizes?: readonly number[]
  columnAlignments?: readonly DataTableSkeletonAlignment[]
  rowClassName?: string
}

const FALLBACK_WIDTH_PERCENTAGES = [
  72,
  56,
  84,
  64,
] as const

const alignmentClassNames: Record<
  DataTableSkeletonAlignment,
  string
> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
}

function normalizePositiveInteger(
  value: number
): number {
  return Number.isSafeInteger(value) && value > 0
    ? value
    : 0
}

function isValidColumnSize(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  )
}

function resolveSkeletonWidthStyle(
  columnIndex: number,
  columnSizes?: readonly number[]
): CSSProperties {
  const columnSize =
    columnSizes?.[columnIndex]

  if (isValidColumnSize(columnSize)) {
    const availableWidth = Math.max(
      8,
      columnSize - 16
    )

    const preferredWidth = Math.max(
      8,
      columnSize * 0.68
    )

    return {
      width: `${Math.min(
        preferredWidth,
        availableWidth
      )}px`,
      maxWidth: "100%",
    }
  }

  const fallbackWidth =
    FALLBACK_WIDTH_PERCENTAGES[
    columnIndex %
    FALLBACK_WIDTH_PERCENTAGES.length
    ]

  return {
    width: `${fallbackWidth}%`,
    maxWidth: "100%",
  }
}

function resolveColumnAlignment(
  columnIndex: number,
  columnAlignments:
    | readonly DataTableSkeletonAlignment[]
    | undefined
): DataTableSkeletonAlignment {
  return (
    columnAlignments?.[columnIndex] ??
    "start"
  )
}

export function DataTableLoadingSkeleton({
  columnCount,
  rowCount,
  columnSizes,
  columnAlignments,
  rowClassName,
}: DataTableLoadingSkeletonProps) {
  const safeColumnCount =
    normalizePositiveInteger(columnCount)

  const safeRowCount =
    normalizePositiveInteger(rowCount)

  if (
    safeColumnCount === 0 ||
    safeRowCount === 0
  ) {
    return null
  }

  return (
    <>
      {Array.from(
        { length: safeRowCount },
        (_, rowIndex) => (
          <TableRow
            key={`loading-row-${rowIndex}`}
            aria-hidden="true"
            className={cn(
              "h-12",
              rowClassName
            )}
          >
            {Array.from(
              { length: safeColumnCount },
              (_, columnIndex) => {
                const alignment =
                  resolveColumnAlignment(
                    columnIndex,
                    columnAlignments
                  )

                return (
                  <TableCell
                    key={`loading-cell-${rowIndex}-${columnIndex}`}
                  >
                    <div
                      className={cn(
                        "flex w-full",
                        alignmentClassNames[
                        alignment
                        ]
                      )}
                    >
                      <Skeleton
                        className="h-5"
                        style={resolveSkeletonWidthStyle(
                          columnIndex,
                          columnSizes
                        )}
                      />
                    </div>
                  </TableCell>
                )
              }
            )}
          </TableRow>
        )
      )}
    </>
  )
}
