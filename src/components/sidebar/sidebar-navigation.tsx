"use client"

import { SidebarContent } from "@/components/ui/sidebar"

import { SidebarNavigationGroup } from "./sidebar-navigation-group"
import { validateSidebarGroups } from "./sidebar-validation"
import type { SidebarNavigationGroup as SidebarNavigationGroupData } from "./sidebar.types"

export type SidebarNavigationProps = {
  groups: readonly SidebarNavigationGroupData[]
  busy?: boolean
}

export function SidebarNavigation({
  groups,
  busy = false,
}: SidebarNavigationProps) {
  if (import.meta.env.DEV) {
    validateSidebarGroups(groups)
  }

  const busyProps = busy ? { "aria-busy": true as const } : {}

  return (
    <SidebarContent {...busyProps}>
      {groups.map((group) => (
        <SidebarNavigationGroup key={group.id} group={group} />
      ))}
    </SidebarContent>
  )
}
