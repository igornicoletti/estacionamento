"use client"

import * as React from "react"
import { NavLink, useLocation } from "react-router"

import { shouldBypassAuthInDev } from "@/config"
import { useAuth } from "@/features/auth"

import {
  navigationGroups,
  routeIconById,
} from "./sidebar-config"
import {
  canAccessSidebarRoute,
  isSidebarRouteActive,
} from "./sidebar-route-utils"
import type {
  SidebarNavigationBadgeMap,
  SidebarNavigationGroup,
  SidebarNavigationLeaf,
} from "./sidebar.types"

const EMPTY_BADGES: SidebarNavigationBadgeMap = {}

export function useSidebarNavigationModel(
  badgesByRouteId: SidebarNavigationBadgeMap = EMPTY_BADGES
) {
  const location = useLocation()
  const auth = useAuth()

  return React.useMemo<readonly SidebarNavigationGroup[]>(() => {
    const bypassAuth = shouldBypassAuthInDev()

    return navigationGroups
      .map((group): SidebarNavigationGroup => {
        const items = group.items
          .filter((route) =>
            canAccessSidebarRoute(
              route.requiredPermissions,
              auth.access.hasAllPermissions,
              bypassAuth
            )
          )
          .map<SidebarNavigationLeaf>((route) => {
            const isActive = isSidebarRouteActive(
              location.pathname,
              route.href
            )

            const badge = badgesByRouteId[route.id]
            const Icon = routeIconById[route.id]

            return {
              id: route.id,
              label: route.label,
              isActive,
              ...(Icon ? { icon: Icon } : {}),
              ...(badge ? { badge } : {}),
              renderLink: ({
                children,
                onClick,
                "aria-label": ariaLabel,
              }) => (
                <NavLink
                  to={route.href}
                  end={route.href === "/"}
                  onClick={onClick}
                  aria-label={ariaLabel}
                >
                  {children}
                </NavLink>
              ),
            }
          })

        /*
         * Um grupo sem label é válido e deve ser renderizado como grupo
         * estático, sem SidebarGroupLabel.
         *
         * Grupos colapsáveis precisam obrigatoriamente de label, porque o
         * label funciona como o trigger acessível do Collapsible.
         */
        if (!group.label.trim()) {
          return {
            id: group.id,
            collapsible: false,
            items,
          }
        }

        const hasActiveItem = items.some((item) => item.isActive)

        return {
          id: group.id,
          label: group.label,
          collapsible: true,
          defaultOpen: hasActiveItem,
          items,
        }
      })
      .filter((group) => group.items.length > 0)
  }, [
    auth.access.hasAllPermissions,
    badgesByRouteId,
    location.pathname,
  ])
}
