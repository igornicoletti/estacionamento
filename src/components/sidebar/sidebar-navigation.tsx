import { useLocation } from "react-router"

import { shouldBypassAuthInDev } from "@/config"
import {
  hasAllCapabilities,
  isUserRole,
  type UserRole,
} from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"

import {
  navigationGroups,
  type SidebarNavigationItem,
} from "./sidebar-config"
import { SidebarNavGroup } from "./sidebar-nav-group"

type UnknownRecord = Record<PropertyKey, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function getProfileRole(profile: unknown): UserRole | null {
  if (!isRecord(profile)) {
    return null
  }

  return isUserRole(profile.role) ? profile.role : null
}

function canAccessNavigationItem(
  item: SidebarNavigationItem,
  role: UserRole | null
) {
  if (shouldBypassAuthInDev() || (import.meta.env.DEV && !role)) {
    return true
  }

  if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) {
    return true
  }

  return hasAllCapabilities(role, item.requiredCapabilities)
}

export function SidebarNavigation() {
  const location = useLocation()
  const { profile } = useAuthSession()
  const role = getProfileRole(profile)

  const visibleGroups = navigationGroups
    .map((group) => {
      return {
        ...group,
        items: group.items.filter((item) => {
          return canAccessNavigationItem(item, role)
        }),
      }
    })
    .filter((group) => group.items.length > 0)

  return (
    <>
      {visibleGroups.map((group) => (
        <SidebarNavGroup
          key={group.id}
          label={group.label}
          items={group.items}
          activePathname={location.pathname}
          className={group.id === visibleGroups[0]?.id ? "mt-2" : "mt-0.5"}
        />
      ))}
    </>
  )
}
