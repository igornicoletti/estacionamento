import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AuthSubmitButton } from "@/features/auth/components"

describe("AuthSubmitButton", () => {
  it("shows loader text while loading", () => {
    render(
      <AuthSubmitButton isLoading>
        Continuar
      </AuthSubmitButton>
    )

    expect(screen.getByRole("button", { name: "Autenticando" })).toBeDisabled()
    expect(screen.queryByText("Continuar")).not.toBeInTheDocument()
  })

  it("renders custom loading text when provided", () => {
    render(
      <AuthSubmitButton isLoading loadingText="Validando credenciais">
        Continuar
      </AuthSubmitButton>
    )

    expect(
      screen.getByRole("button", { name: "Validando credenciais" })
    ).toBeDisabled()
  })
})
