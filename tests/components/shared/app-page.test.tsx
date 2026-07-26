import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppPage } from "@/components/shared"

describe("AppPage", () => {
  it("renders heading, actions and content in the authenticated page structure", () => {
    render(
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
    expect(screen.getByText("Conteúdo principal")).toBeInTheDocument()
  })
})
