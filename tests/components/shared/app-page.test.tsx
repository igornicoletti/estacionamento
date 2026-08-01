import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppPage } from "@/components/shared"

describe("AppPage", () => {
  it("renders heading, actions and content in the authenticated page structure", () => {
    const { container } = render(
      <AppPage
        title="Título operacional"
        subtitle="Subtítulo da página"
        actions={<button type="button">Ação</button>}
      >
        <div>Conteúdo principal</div>
      </AppPage>
    )

    expect(
      screen.getByRole("heading", { name: "Título operacional" })
    ).toBeInTheDocument()
    expect(screen.getByText("Subtítulo da página")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument()
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument()
    const content = screen.getByText("Conteúdo principal")
    const page = content.parentElement?.parentElement

    expect(content).toBeInTheDocument()
    expect(page).toHaveClass("min-w-0")
    expect(page).toHaveClass("overflow-x-clip")
    expect(content.parentElement).not.toHaveClass("min-h-screen")
  })
})
