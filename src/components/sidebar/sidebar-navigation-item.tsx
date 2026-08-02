"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { useSidebarCollapsibleState } from "./sidebar-collapsible-state"
import { renderSidebarLink } from "./sidebar-link"
import type {
  SidebarNavigationBranch,
  SidebarNavigationItem as SidebarNavigationItemData,
  SidebarNavigationLeaf,
  SidebarNavigationSubItem,
} from "./sidebar.types"

export type SidebarNavigationItemProps = {
  item: SidebarNavigationItemData
}

function getAccessibilityLabel(item: SidebarNavigationLeaf) {
  const label = item.ariaLabel ?? item.label
  return item.badge ? `${label}, ${item.badge.ariaLabel}` : label
}

function useCloseMobileNavigation() {
  const { isMobile, setOpenMobile } = useSidebar()

  return React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])
}

function SidebarNavigationLeafItem({
  item,
}: {
  item: SidebarNavigationLeaf
}) {
  const { isMobile, state } = useSidebar()
  const closeMobileNavigation = useCloseMobileNavigation()
  const Icon =
    !isMobile && state === "collapsed"
      ? (item.collapsedIcon ?? item.icon)
      : item.icon
  const hasIconModeRepresentation = Boolean(item.icon ?? item.collapsedIcon)
  const accessibilityLabel = getAccessibilityLabel(item)
  const link = renderSidebarLink({
    target: item,
    ariaLabel: accessibilityLabel,
    onClick: closeMobileNavigation,
    children: (
      <>
        {Icon ? <Icon aria-hidden="true" /> : null}
        <span>{item.label}</span>
      </>
    ),
  })

  const iconModeVisibilityProps = hasIconModeRepresentation
    ? {}
    : { className: "group-data-[collapsible=icon]:hidden" }

  return (
    <SidebarMenuItem {...iconModeVisibilityProps}>
      <SidebarMenuButton
        asChild
        isActive={item.isActive ?? false}
        tooltip={item.tooltip ?? accessibilityLabel}
      >
        {link}
      </SidebarMenuButton>

      {item.badge ? (
        <SidebarMenuBadge aria-hidden="true">
          {item.badge.content}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}

function SidebarNavigationSubMenuItem({
  item,
}: {
  item: SidebarNavigationSubItem
}) {
  const closeMobileNavigation = useCloseMobileNavigation()
  const Icon = item.icon
  const accessibilityLabel = item.ariaLabel ?? item.label
  const link = renderSidebarLink({
    target: item,
    ariaLabel: accessibilityLabel,
    onClick: closeMobileNavigation,
    children: (
      <>
        {Icon ? <Icon aria-hidden="true" /> : null}
        <span>{item.label}</span>
      </>
    ),
  })

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={item.isActive ?? false}
      >
        {link}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

function SidebarNavigationBranchItem({
  item,
}: {
  item: SidebarNavigationBranch
}) {
  const { isMobile, state, setOpen: setSidebarOpen } = useSidebar()
  const childIsActive = item.items.some((child) => child.isActive)
  const isActive = item.isActive ?? childIsActive
  const [open, setOpen] = useSidebarCollapsibleState({
    ...item,
    fallbackOpen: isActive,
  })
  const Icon =
    !isMobile && state === "collapsed"
      ? (item.collapsedIcon ?? item.icon)
      : item.icon
  const hasIconModeRepresentation = Boolean(item.icon ?? item.collapsedIcon)
  const accessibilityLabel = item.ariaLabel ?? item.label

  const iconModeVisibilityProps = hasIconModeRepresentation
    ? {}
    : { className: "group-data-[collapsible=icon]:hidden" }

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem {...iconModeVisibilityProps}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isActive}
            tooltip={item.tooltip ?? accessibilityLabel}
            aria-label={accessibilityLabel}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              if (!isMobile && state === "collapsed") {
                event.preventDefault()
                setSidebarOpen(true)
                setOpen(true)
              }
            }}
          >
            {Icon ? <Icon aria-hidden="true" /> : null}
            <span>{item.label}</span>
            <ChevronRightIcon
              aria-hidden="true"
              className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((child) => (
              <SidebarNavigationSubMenuItem key={child.id} item={child} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function SidebarNavigationItem({
  item,
}: SidebarNavigationItemProps) {
  return item.kind === "collapsible" ? (
    <SidebarNavigationBranchItem item={item} />
  ) : (
    <SidebarNavigationLeafItem item={item} />
  )
}
