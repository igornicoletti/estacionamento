import { ListFilterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { dataTableCopy } from "./data-table-copy"
import {
  DataTableFilterIcon,
  type DataTableFilterKind,
} from "./data-table-filter-icon"
import { type LucideIcon } from "lucide-react"

export interface DataTableFilterMenuItem {
  id: string
  icon?: LucideIcon
  kind: DataTableFilterKind
  label: string
}

interface DataTableFilterMenuProps {
  items: readonly DataTableFilterMenuItem[]
  onSelect: (id: string) => void
}

export function DataTableFilterMenu({
  items,
  onSelect,
}: DataTableFilterMenuProps) {
  const hasAvailableFilters = items.length > 0

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className="h-9 rounded-full px-3"
      aria-label={
        hasAvailableFilters
          ? dataTableCopy.toolbar.addFilterAriaLabel
          : dataTableCopy.toolbar.allFiltersAdded
      }
      disabled={!hasAvailableFilters}
    >
      <ListFilterIcon data-icon="inline-start" aria-hidden="true" />
      {dataTableCopy.toolbar.addFilter}
    </Button>
  )

  if (!hasAvailableFilters) {
    return <span title={dataTableCopy.toolbar.allFiltersAdded}>{trigger}</span>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-48 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem key={item.id} onSelect={() => onSelect(item.id)}>
              <DataTableFilterIcon
                icon={item.icon}
                kind={item.kind}
                className="text-muted-foreground"
              />
              <span className="min-w-0 truncate">{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
