import { describe, expect, it } from "vitest"

import { appRouteDefinitions } from "@/app/router/route-definitions"
import { navigationGroups } from "@/components/sidebar/sidebar-config"
import { routeCapabilities } from "@/features/auth"

describe("clients route and sidebar integration", () => {
  it("exposes clients route with required capability", () => {
    const clientsRoute = appRouteDefinitions.find((route) => route.id === "clients")

    expect(clientsRoute).toBeDefined()
    expect(clientsRoute?.path).toBe("clientes")
    expect(clientsRoute?.requiredCapabilities).toEqual(routeCapabilities.clients)
  })

  it("shows clients entry in sidebar navigation groups", () => {
    const hasClientsItem = navigationGroups.some((group) => {
      return group.items.some((item) => item.id === "clients" && item.href === "/clientes")
    })

    expect(hasClientsItem).toBe(true)
  })
})
