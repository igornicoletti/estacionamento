import { render } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/sidebar", () => ({
  AppHeader: () => <header data-testid="app-header" />,
  AppSidebar: () => <aside data-testid="app-sidebar" />,
}))

describe("AuthenticatedLayout", () => {
  it("uses SidebarInset as the only main landmark", async () => {
    const { AuthenticatedLayout } = await import("@/app/layouts")

    const { container } = render(
      <MemoryRouter>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route index element={<div>Conteúdo da rota</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(container.querySelectorAll("main")).toHaveLength(1)
  })
})
