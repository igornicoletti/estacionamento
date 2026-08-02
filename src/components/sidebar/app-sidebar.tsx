"use client"

import { Link } from "react-router"

import {
  Sidebar,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { SidebarBrand } from "./sidebar-brand"
import { sidebarBrand } from "./sidebar-config"
import { sidebarCopy } from "./sidebar-copy"
import { SidebarNavigation } from "./sidebar-navigation"
import { useSidebarNavigationModel } from "./sidebar-navigation-model"
import { SidebarNavigationSkeleton } from "./sidebar-navigation-skeleton"
import { SidebarResponsiveTrigger } from "./sidebar-responsive-trigger"
import type {
  SidebarNavigationBadgeMap,
  SidebarSide,
  SidebarSkeletonOptions,
  SidebarVariant,
} from "./sidebar.types"

export type AppSidebarProps = {
  homeHref: `/${string}`
  badgesByRouteId?: SidebarNavigationBadgeMap
  loading?: boolean
  skeleton?: SidebarSkeletonOptions
  side?: SidebarSide
  variant?: SidebarVariant
  dir?: "ltr" | "rtl"
  showRail?: boolean
}

export function AppSidebar({
  homeHref,
  badgesByRouteId,
  loading = false,
  skeleton,
  side = "left",
  variant = "sidebar",
  dir,
  showRail = true,
}: AppSidebarProps) {
  const groups = useSidebarNavigationModel(badgesByRouteId)
  const skeletonOptions = skeleton ?? {
    ariaLabel: sidebarCopy.navigation.loading,
    count: 6,
    showIcon: true,
  }

  const directionProps = dir ? { dir } : {}

  return (
    <Sidebar
      {...directionProps}
      aria-label={sidebarCopy.navigation.landmark}
      role="navigation"
      collapsible="icon"
      side={side}
      variant={variant}
      className="group-data-[side=left]:border-r-0 group-data-[side=right]:border-l-0"
    >
      <SidebarHeader className="sticky top-0 z-10 h-(--app-header-height,4rem) shrink-0 justify-center overflow-hidden bg-background px-2 py-0 transition-[height] ease-linear group-data-[collapsible=icon]:h-(--app-header-height-collapsed,3rem)">
        <div className="flex w-full items-center gap-2">
          <div className="min-w-0 flex-1">
            <SidebarBrand
              brand={{
                label: sidebarBrand.name,
                tooltip: sidebarBrand.name,
                expandedLogo: (
                  <img
                    src={sidebarBrand.expandedLogoUrl}
                    alt=""
                    className="h-12 w-auto object-contain"
                  />
                ),
                collapsedLogo: (
                  <img
                    src={sidebarBrand.collapsedLogoUrl}
                    alt=""
                    className="size-8 object-contain"
                  />
                ),
                renderLink: ({ children, ...linkProps }) => (
                  <Link to={homeHref} {...linkProps}>
                    {children}
                  </Link>
                ),
              }}
            />
          </div>

          <SidebarResponsiveTrigger
            placement="header"
            labels={sidebarCopy.toggle}
          />
        </div>
      </SidebarHeader>

      {loading ? (
        <SidebarNavigationSkeleton {...skeletonOptions} />
      ) : (
        <SidebarNavigation groups={groups} />
      )}

      <SidebarResponsiveTrigger
        placement="footer"
        labels={sidebarCopy.toggle}
      />

      {showRail ? <SidebarRail /> : null}
    </Sidebar>
  )
}
