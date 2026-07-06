import { sidebarCopy } from "./sidebar-copy"

export function SidebarFooterText() {
  return (
    <div className="overflow-x-hidden border-t border-sidebar-border/10 py-2 group-data-[collapsible=icon]:px-0">
      <p className="w-full min-w-0 px-2 py-2 truncate text-center text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:px-0">
        <span className="group-data-[collapsible=icon]:hidden">
          {sidebarCopy.brand.name}
        </span>
        <span className="hidden group-data-[collapsible=icon]:inline">
          {sidebarCopy.brand.shortName}
        </span>
      </p>
    </div>
  )
}
