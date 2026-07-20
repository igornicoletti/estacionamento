import { LayoutDashboardIcon, ParkingCircleIcon, ShieldCheckIcon, TruckIcon, UserRoundIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import {
  appRouteIds,
  appRoutePaths,
  appRouteSegments,
  authenticatedRouteRegistry,
} from "@/app/router/route-registry"
import {
  navigationGroups,
  routeIconById,
} from "@/components/sidebar/sidebar-config"
import { AUTH_PERMISSION } from "@/features/auth"

describe("clients route and sidebar integration", () => {
  it("exposes clients route with required permission", () => {
    const clientsRoute = authenticatedRouteRegistry.find((route) => route.id === appRouteIds.clients)

    expect(clientsRoute).toBeDefined()
    expect(clientsRoute?.path).toBe(appRouteSegments.clients)
    expect(clientsRoute?.requiredPermissions).toEqual([AUTH_PERMISSION.clientsRead])
  })

  it("shows clients entry in sidebar navigation groups", () => {
    const hasClientsItem = navigationGroups.some((group) => {
      return group.items.some((item) => item.id === appRouteIds.clients && item.href === appRoutePaths.clients)
    })

    expect(hasClientsItem).toBe(true)
  })

  it("orders visible sidebar groups and labels them for end users", () => {
    expect(navigationGroups.map((group) => group.label)).toEqual([
      "",
      "Cadastros",
      "Monitoramento",
      "Configurações",
    ])
    expect(navigationGroups[0]?.items.map((item) => item.id)).toEqual([
      appRouteIds.home,
      appRouteIds.yard,
      appRouteIds.reports,
    ])
    expect(navigationGroups[1]?.items.map((item) => item.id)).toEqual([
      appRouteIds.units,
      appRouteIds.clients,
      appRouteIds.prices,
      appRouteIds.rules,
    ])
    expect(navigationGroups[3]?.items.map((item) => item.id)).toEqual([
      appRouteIds.profile,
      appRouteIds.security,
      appRouteIds.users,
      appRouteIds.permissions,
    ])
    expect(routeIconById[appRouteIds.home]).toBe(LayoutDashboardIcon)
    expect(routeIconById[appRouteIds.yard]).toBe(ParkingCircleIcon)
    expect(routeIconById[appRouteIds.clients]).toBe(TruckIcon)
    expect(routeIconById[appRouteIds.profile]).toBe(UserRoundIcon)
    expect(routeIconById[appRouteIds.security]).toBe(ShieldCheckIcon)
  })
})
