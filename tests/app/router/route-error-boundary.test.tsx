import { render, screen } from "@testing-library/react"
import {
  MemoryRouter,
  useRouteError,
} from "react-router"
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { RouteErrorBoundary } from "@/app/router/route-error-boundary"

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>(
    "react-router"
  )

  return {
    ...actual,
    useRouteError: vi.fn(),
  }
})

vi.mock("@/features/auth/hooks", () => {
  return {
    useAuthSession: () => ({
      profile: {
        role: "admin",
        status: "active",
      },
    }),
  }
})

describe("RouteErrorBoundary", () => {
  const mockedUseRouteError = vi.mocked(useRouteError)

  afterEach(() => {
    mockedUseRouteError.mockReset()
  })

  it("renders unexpected error using Empty layout with a link action", () => {
    mockedUseRouteError.mockReturnValue(new Error("boom"))

    const { container } = render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>
    )

    expect(screen.getByText("Erro inesperado")).toBeInTheDocument()
    expect(
      screen.getByText(
        "A aplicação encontrou um erro ao renderizar esta rota. Tente novamente ou retorne para a página inicial."
      )
    ).toBeInTheDocument()

    const empty = container.querySelector('[data-slot="empty"]')
    expect(empty).not.toBeNull()

    const backLink = screen.getByRole("link", { name: "Voltar para o início" })
    expect(backLink).toHaveAttribute("href", "/unidades")
  })
})
