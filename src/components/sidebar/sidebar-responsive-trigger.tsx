"use client"

import {
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import type { SidebarToggleLabels } from "./sidebar.types"

export type SidebarResponsiveTriggerProps =
  | {
      placement: "header"
      labels: SidebarToggleLabels
    }
  | {
      placement: "footer"
      labels: SidebarToggleLabels
    }

export function SidebarResponsiveTrigger({
  placement,
  labels,
}: SidebarResponsiveTriggerProps) {
  const { isMobile, state } = useSidebar()

  if (placement === "header") {
    if (!isMobile) {
      return null
    }

    return (
      <SidebarTrigger
        aria-label={labels.closeMobile}
        title={labels.closeMobile}
      />
    )
  }

  if (isMobile) {
    return null
  }

  const label = state === "collapsed" ? labels.expand : labels.collapse

  return (
    <SidebarFooter className="sticky bottom-0 z-10 hidden shrink-0 bg-sidebar lg:flex group-data-[collapsible=icon]:items-center">
      <SidebarTrigger aria-label={label} title={label} />
    </SidebarFooter>
  )
}
