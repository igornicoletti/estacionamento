import type { AuthPermission } from "@/features/auth"

export function isSidebarRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function canAccessSidebarRoute(
  requiredPermissions: readonly AuthPermission[] | undefined,
  hasAllPermissions: (permissions: readonly AuthPermission[]) => boolean,
  bypassAuth: boolean
) {
  return (
    bypassAuth ||
    !requiredPermissions ||
    requiredPermissions.length === 0 ||
    hasAllPermissions(requiredPermissions)
  )
}
