import { useLocation } from "react-router"

import { shouldBypassAuthInDev } from "@/config"
import type { AuthPermission } from "@/features/auth"
import { useAuth } from "@/features/auth"

import { navigationGroups, type SidebarNavigationItem } from "./sidebar-config"
import { SidebarNavGroup } from "./sidebar-nav-group"

function canAccessNavigationItem(
  item: SidebarNavigationItem,
  hasAllPermissions: (permissions: readonly AuthPermission[]) => boolean
) {
  if (shouldBypassAuthInDev()) {
    return true
  }

  if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
    return true
  }

  return hasAllPermissions(item.requiredPermissions)
}

export function SidebarNavigation() {
  const location = useLocation()
  const auth = useAuth()

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccessNavigationItem(item, auth.access.hasAllPermissions)
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {visibleGroups.map((group) => (
        <SidebarNavGroup
          key={group.id}
          label={group.label}
          items={group.items}
          activePathname={location.pathname}
        />
      ))}
    </>
  )
}
