import { render } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/app-header", () => ({
  AppHeader: () => <header data-testid="app-header" />,
}))

vi.mock("@/components/sidebar", () => ({
  AppSidebar: () => <aside data-testid="app-sidebar" />,
  SidebarLayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock("@/features/notifications", () => ({
  useNotifications: () => ({ unreadCount: 0 }),
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
