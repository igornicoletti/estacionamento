import type * as React from "react"
import type { LucideIcon } from "lucide-react"

export type SidebarSide = "left" | "right"
export type SidebarVariant = "sidebar" | "floating" | "inset"

export type SidebarToggleLabels = {
  expand: string
  collapse: string
  closeMobile: string
}

export type SidebarLayoutMetrics = {
  headerHeight?: string
  collapsedHeaderHeight?: string
}

export type SidebarLinkRenderProps = {
  children: React.ReactNode
  onClick: React.MouseEventHandler<HTMLAnchorElement>
  "aria-label": string
}

/**
 * Internal application navigation must be supplied by the router adapter.
 * This intentionally has no plain `href` fallback, preventing accidental
 * full-document navigation for SPA routes.
 */
export type SidebarLinkTarget = {
  renderLink: (props: SidebarLinkRenderProps) => React.ReactElement
}

export type SidebarBrandConfig = SidebarLinkTarget & {
  label: string
  expandedLogo: React.ReactElement
  collapsedLogo: React.ReactElement
  mobileLogo?: React.ReactElement
  tooltip?: string
}

export type SidebarNavigationBadge = {
  content: React.ReactNode
  ariaLabel: string
}

export type SidebarItemIconConfig = {
  icon?: LucideIcon
  collapsedIcon?: LucideIcon
}

export type SidebarNavigationSubItem = SidebarLinkTarget &
  SidebarItemIconConfig & {
    id: string
    label: string
    tooltip?: string
    ariaLabel?: string
    isActive?: boolean
  }

export type SidebarNavigationLeaf = SidebarLinkTarget &
  SidebarItemIconConfig & {
    kind?: "item"
    id: string
    label: string
    tooltip?: string
    ariaLabel?: string
    isActive?: boolean
    badge?: SidebarNavigationBadge
  }

export type SidebarControlledCollapsibleState = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOpen?: never
}

export type SidebarUncontrolledCollapsibleState = {
  open?: never
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export type SidebarCollapsibleState =
  | SidebarControlledCollapsibleState
  | SidebarUncontrolledCollapsibleState

export type SidebarNavigationBranch = SidebarItemIconConfig &
  SidebarCollapsibleState & {
    kind: "collapsible"
    id: string
    label: string
    tooltip?: string
    ariaLabel?: string
    isActive?: boolean
    items: readonly SidebarNavigationSubItem[]
  }

export type SidebarNavigationItem =
  | SidebarNavigationLeaf
  | SidebarNavigationBranch

type SidebarGroupBase = {
  id: string
  ariaLabel?: string
  items: readonly SidebarNavigationItem[]
}

export type SidebarStaticNavigationGroup = SidebarGroupBase & {
  collapsible?: false
  label?: string
  open?: never
  defaultOpen?: never
  onOpenChange?: never
}

export type SidebarCollapsibleNavigationGroup = SidebarGroupBase &
  SidebarCollapsibleState & {
    collapsible: true
    label: string
  }

export type SidebarNavigationGroup =
  | SidebarStaticNavigationGroup
  | SidebarCollapsibleNavigationGroup

export type SidebarSkeletonOptions = {
  count?: number
  showIcon?: boolean
  ariaLabel: string
}

export type SidebarNavigationBadgeMap = Readonly<
  Partial<Record<string, SidebarNavigationBadge>>
>
