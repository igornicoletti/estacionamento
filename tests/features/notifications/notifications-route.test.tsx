import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { NotificationsRoute } from "@/features/notifications"

describe("NotificationsRoute", () => {
  it("renders notifications with standardized labels and hides raw identifiers in details", async () => {
    render(
      <MemoryRouter>
        <NotificationsRoute />
      </MemoryRouter>
    )

    expect(
      screen.getByRole("heading", { name: "Notificações" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Marcar todas como lidas" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Sincronização concluída")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Sincronização concluída" }))

    expect(
      screen.getByRole("heading", { name: "Sincronização concluída" })
    ).toBeInTheDocument()
    expect(screen.queryByText("ID")).not.toBeInTheDocument()
    expect(screen.queryByText("N-001")).not.toBeInTheDocument()
  })
})
