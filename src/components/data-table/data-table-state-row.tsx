import * as React from "react"

import { TableCell, TableRow } from "@/components/ui/table"

type DataTableStateKind = "empty" | "loading"

interface DataTableStateRowProps {
  colSpan: number
  kind: DataTableStateKind
  children?: React.ReactNode
}

export function DataTableStateRow({
  colSpan,
  kind,
  children,
}: DataTableStateRowProps) {
  const safeColSpan = Math.max(colSpan, 1)
  const isLoading = kind === "loading"

  return (
    <TableRow>
      <TableCell colSpan={safeColSpan} className="h-24 text-center">
        {isLoading ? (
          <div role="status" aria-live="polite" data-state-kind={kind}>
            {children}
          </div>
        ) : (
          <div data-state-kind={kind}>{children}</div>
        )}
      </TableCell>
    </TableRow>
  )
}
