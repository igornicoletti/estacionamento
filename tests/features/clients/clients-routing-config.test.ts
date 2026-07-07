import { TruckIcon, UserRoundIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { appRouteDefinitions } from "@/app/router/route-definitions"
import {
  navigationGroups,
  routeIconById,
} from "@/components/sidebar/sidebar-config"
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

  it("orders visible sidebar groups and labels them for end users", () => {
    expect(navigationGroups.map((group) => group.label)).toEqual([
      "Cadastros",
      "Comercial",
      "Acesso",
      "Monitoramento",
      "Configurações",
    ])

    expect(navigationGroups[0]?.items.map((item) => item.id)).toEqual([
      "units",
      "clients",
    ])
    expect(navigationGroups[1]?.items.map((item) => item.id)).toEqual([
      "prices",
      "rules",
    ])
    expect(navigationGroups[2]?.items.map((item) => item.id)).toEqual([
      "users",
      "accessRequests",
      "permissions",
    ])
    expect(navigationGroups[3]?.items.map((item) => item.id)).toEqual([
      "audit",
      "notifications",
    ])
    expect(navigationGroups[4]?.items.map((item) => item.id)).toEqual([
      "settings",
    ])

    expect(routeIconById.clients).toBe(TruckIcon)
    expect(routeIconById.settings).toBe(UserRoundIcon)
  })
})
