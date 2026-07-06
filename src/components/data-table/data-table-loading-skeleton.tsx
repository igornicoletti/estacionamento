import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

interface DataTableLoadingSkeletonProps {
  columnCount: number
  rowCount: number
  columnSizes?: readonly number[]
}

function normalizePositiveInteger(value: number, fallback: number) {
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function getSkeletonWidthClass(columnIndex: number, columnCount: number) {
  if (columnCount <= 2) {
    return "w-3/4"
  }

  if (columnIndex === columnCount - 1) {
    return "w-10"
  }

  if (columnIndex === 0) {
    return "w-32"
  }

  return columnIndex % 3 === 0 ? "w-2/3" : "w-full"
}

function getSkeletonWidthStyle(columnIndex: number, columnSizes?: readonly number[]) {
  const width = columnSizes?.[columnIndex]

  if (!width || !Number.isFinite(width) || width <= 0) {
    return undefined
  }

  const safeWidth = Math.max(28, Math.min(width * 0.82, width - 24))

  return { width: `${safeWidth}px` }
}

export function DataTableLoadingSkeleton({
  columnCount,
  rowCount,
  columnSizes,
}: DataTableLoadingSkeletonProps) {
  const safeColumnCount = normalizePositiveInteger(columnCount, 1)
  const safeRowCount = normalizePositiveInteger(rowCount, 1)

  return (
    <>
      {Array.from({ length: safeRowCount }).map((_, rowIndex) => (
        <TableRow key={`loading-row-${rowIndex}`} aria-hidden="true">
          {Array.from({ length: safeColumnCount }).map((__, columnIndex) => (
            <TableCell key={`loading-cell-${rowIndex}-${columnIndex}`}>
              <Skeleton
                className={`h-4 ${getSkeletonWidthClass(
                  columnIndex,
                  safeColumnCount
                )}`}
                style={getSkeletonWidthStyle(columnIndex, columnSizes)}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
