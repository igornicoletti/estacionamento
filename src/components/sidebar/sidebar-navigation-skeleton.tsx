"use client"

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"

import type { SidebarSkeletonOptions } from "./sidebar.types"

export type SidebarNavigationSkeletonProps = SidebarSkeletonOptions

export function SidebarNavigationSkeleton({
  count = 5,
  showIcon = true,
  ariaLabel,
}: SidebarNavigationSkeletonProps) {
  const normalizedCount = Number.isFinite(count)
    ? Math.min(100, Math.max(1, Math.floor(count)))
    : 5

  return (
    <SidebarContent aria-busy="true">
      <span className="sr-only" role="status">
        {ariaLabel}
      </span>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {Array.from({ length: normalizedCount }, (_, index) => (
              <SidebarMenuItem key={`sidebar-skeleton-${index}`}>
                <SidebarMenuSkeleton showIcon={showIcon} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
