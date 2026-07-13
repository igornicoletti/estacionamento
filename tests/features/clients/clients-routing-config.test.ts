import { TruckIcon, UserRoundIcon } from "lucide-react"
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
      "Área de trabalho",
      "Cadastros",
      "Comercial",
      "Acesso",
      "Monitoramento",
      "Configurações",
    ])
    expect(navigationGroups[0]?.items.map((item) => item.id)).toEqual([
      appRouteIds.home,
    ])
    expect(navigationGroups[1]?.items.map((item) => item.id)).toEqual([
      appRouteIds.units,
      appRouteIds.clients,
    ])
    expect(navigationGroups[5]?.items.map((item) => item.id)).toEqual([
      appRouteIds.settings,
    ])
    expect(routeIconById[appRouteIds.clients]).toBe(TruckIcon)
    expect(routeIconById[appRouteIds.settings]).toBe(UserRoundIcon)
  })
})
