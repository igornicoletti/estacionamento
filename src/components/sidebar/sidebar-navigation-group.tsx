"use client"

import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar"

import { useSidebarCollapsibleState } from "./sidebar-collapsible-state"
import { SidebarNavigationItem } from "./sidebar-navigation-item"
import type {
  SidebarCollapsibleNavigationGroup,
  SidebarNavigationGroup as SidebarNavigationGroupData,
  SidebarStaticNavigationGroup,
} from "./sidebar.types"

export type SidebarNavigationGroupProps = {
  group: SidebarNavigationGroupData
}

function SidebarGroupItems({
  group,
}: {
  group: SidebarNavigationGroupData
}) {
  return (
    <SidebarGroupContent>
      <SidebarMenu>
        {group.items.map((item) => (
          <SidebarNavigationItem key={item.id} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  )
}

function SidebarStaticGroup({
  group,
}: {
  group: SidebarStaticNavigationGroup
}) {
  const accessibilityProps = group.ariaLabel
    ? { role: "group" as const, "aria-label": group.ariaLabel }
    : {}

  return (
    <SidebarGroup {...accessibilityProps}>
      {group.label ? (
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          {group.label}
        </SidebarGroupLabel>
      ) : null}

      <SidebarGroupItems group={group} />
    </SidebarGroup>
  )
}

function SidebarCollapsibleGroup({
  group,
}: {
  group: SidebarCollapsibleNavigationGroup
}) {
  const { isMobile, state } = useSidebar()
  const [open, setOpen] = useSidebarCollapsibleState({
    ...group,
    fallbackOpen: true,
  })
  const forceOpenForIconMode = !isMobile && state === "collapsed"
  const resolvedOpen = forceOpenForIconMode || open
  const accessibilityProps = group.ariaLabel
    ? { role: "group" as const, "aria-label": group.ariaLabel }
    : {}

  return (
    <Collapsible
      open={resolvedOpen}
      onOpenChange={(nextOpen: boolean) => {
        if (!forceOpenForIconMode) {
          setOpen(nextOpen)
        }
      }}
      className="group/collapsible"
    >
      <SidebarGroup {...accessibilityProps}>
        <SidebarGroupLabel
          asChild
          className="group-data-[collapsible=icon]:hidden"
        >
          <CollapsibleTrigger>
            {group.label}
            <ChevronRightIcon
              aria-hidden="true"
              className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent>
          <SidebarGroupItems group={group} />
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function SidebarNavigationGroup({
  group,
}: SidebarNavigationGroupProps) {
  return group.collapsible ? (
    <SidebarCollapsibleGroup group={group} />
  ) : (
    <SidebarStaticGroup group={group} />
  )
}
