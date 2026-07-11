import { type Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { dataTableCopy } from "./data-table-copy"

type DataTableRowActionVariant = "default" | "destructive"

interface DataTableBaseRowAction {
  id: string
  label: string
  shortcut?: string
  variant?: DataTableRowActionVariant
  separatorBefore?: boolean
}

interface EnabledDataTableRowAction<TData> extends DataTableBaseRowAction {
  disabled?: false
  onSelect: (row: Row<TData>) => void
}

interface DisabledDataTableRowAction extends DataTableBaseRowAction {
  disabled: true
  onSelect?: never
}

export type DataTableRowAction<TData> =
  | EnabledDataTableRowAction<TData>
  | DisabledDataTableRowAction

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions: readonly DataTableRowAction<TData>[]
  label?: string
}

function dedupeRowActions<TData>(
  actions: readonly DataTableRowAction<TData>[]
) {
  const seen = new Set<string>()

  return actions.filter((action) => {
    if (seen.has(action.id)) {
      return false
    }

    seen.add(action.id)
    return true
  })
}

export function DataTableRowActions<TData>({
  row,
  actions,
  label = dataTableCopy.accessibility.openRowActions,
}: DataTableRowActionsProps<TData>) {
  const normalizedActions = React.useMemo(
    () => dedupeRowActions(actions),
    [actions]
  )

  if (!normalizedActions.length) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-no-drag-scroll="true"
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={label}
          className="data-[state=open]:bg-muted"
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <MoreHorizontal aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-no-drag-scroll="true"
        align="end"
        className="w-48"
      >
        {normalizedActions.map((action) => (
          <React.Fragment key={action.id}>
            {action.separatorBefore ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              variant={action.variant}
              disabled={action.disabled}
              onSelect={(event) => {
                event.stopPropagation()

                if (!action.disabled) {
                  action.onSelect(row)
                }
              }}
            >
              {action.label}
              {action.shortcut ? (
                <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
              ) : null}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
