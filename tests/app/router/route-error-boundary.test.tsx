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
    useRevalidator: () => ({ revalidate: vi.fn() }),
    useRouteError: vi.fn(),
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
      screen.getByText(/A aplicação encontrou uma falha inesperada ao renderizar esta rota\. Código:/)
    ).toBeInTheDocument()

    const empty = container.querySelector('[data-slot="empty"]')
    expect(empty).not.toBeNull()

    const backLink = screen.getByRole("link", { name: "Voltar para o início" })
    expect(backLink).toHaveAttribute("href", "/")
  })
})
