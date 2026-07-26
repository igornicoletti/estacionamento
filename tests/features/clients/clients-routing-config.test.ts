import { describe, expect, it } from "vitest"

import {
  appRouteIds,
  appRoutePaths,
  authenticatedRouteRegistry,
} from "@/app/router/route-registry"
import { navigationGroups } from "@/components/sidebar/sidebar-config"
import { AUTH_PERMISSION } from "@/features/auth"

describe("clients route and sidebar integration", () => {
  it("exposes clients route with required permission", () => {
    const clientsRoute = authenticatedRouteRegistry.find((route) => {
      return route.id === appRouteIds.clients
    })

    expect(clientsRoute).toBeDefined()
    expect(clientsRoute?.path).toBe("clientes")
    expect(clientsRoute?.requiredPermissions).toEqual([AUTH_PERMISSION.clientsRead])
  })

  it("shows clients entry in sidebar navigation groups", () => {
    const hasClientsItem = navigationGroups.some((group) => {
      return group.items.some((item) => {
        return item.id === appRouteIds.clients && item.href === appRoutePaths.clients
      })
    })

    expect(hasClientsItem).toBe(true)
  })
})
