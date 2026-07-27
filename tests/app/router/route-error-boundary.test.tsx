import { render, screen, waitFor } from "@testing-library/react"
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

import { RouteErrorBoundary } from "@/app/router/components"

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

  it("renders unexpected error with retry and home actions", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockedUseRouteError.mockReturnValue(new Error("boom"))

    const { container } = render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>
    )

    expect(screen.getByText("Erro inesperado")).toBeInTheDocument()
    expect(
      screen.getByText(
        /A aplicação encontrou uma falha inesperada ao renderizar esta rota./
      )
    ).toBeInTheDocument()

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(
      screen.getByRole("button", { name: /Tentar novamente/ })
    ).toBeInTheDocument()

    const backLink = screen.getByRole("link", { name: "Voltar para o início" })
    expect(backLink).toHaveAttribute("href", "/")

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringMatching(/^\[route-boundary:/),
        expect.any(Error)
      )
    })
    consoleError.mockRestore()
  })
})
