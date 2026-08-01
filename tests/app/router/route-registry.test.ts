import { describe, expect, it } from "vitest"

import {
  appRouteIds,
  authenticatedRouteRegistry,
  isRouteAvailable,
} from "@/app/router/route-registry"

describe("route registry availability", () => {
  it("mantém módulos conhecidos registrados com fallback em produção", () => {
    expect(isRouteAvailable({ id: appRouteIds.reports }, false)).toBe(true)
    expect(isRouteAvailable({ id: appRouteIds.yard }, false)).toBe(true)
  })

  it("mantém capacidades reais disponíveis em qualquer ambiente", () => {
    expect(isRouteAvailable({ id: appRouteIds.clients }, false)).toBe(true)
  })

  it("mantém previews acessíveis no ambiente de teste/desenvolvimento", () => {
    expect(authenticatedRouteRegistry.map((route) => route.id)).toEqual(
      expect.arrayContaining([appRouteIds.reports, appRouteIds.yard])
    )
  })
})
