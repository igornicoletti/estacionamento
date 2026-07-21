import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { NotificationsProvider } from "@/features/notifications/context/notifications-provider"
import { NotificationsRoute } from "@/features/notifications/routes/notifications-route"

describe("NotificationsRoute", () => {
  it("renders notifications with standardized labels and hides raw identifiers in details", async () => {
    render(
      <MemoryRouter>
        <NotificationsProvider>
          <NotificationsRoute />
        </NotificationsProvider>
      </MemoryRouter>
    )

    expect(
      screen.getByRole("heading", { name: "Notificações" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Sincronização concluída")).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: "Marcar todas como lidas" })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Sincronização concluída" }))

    expect(
      screen.getByRole("heading", { name: "Sincronização concluída" })
    ).toBeInTheDocument()
    expect(screen.queryByText("ID")).not.toBeInTheDocument()
    expect(screen.queryByText("N-001")).not.toBeInTheDocument()
  })

  it("uses primary badge for read notifications and warning badge for unread notifications", async () => {
    render(
      <MemoryRouter>
        <NotificationsProvider>
          <NotificationsRoute />
        </NotificationsProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Sincronização concluída")).toBeInTheDocument()
    })

    const unreadBadge = screen.getAllByText("Não lida")[0]?.closest("[data-slot='badge']")
    const readBadge = screen.getByText("Lida").closest("[data-slot='badge']")

    expect(unreadBadge).toHaveAttribute("data-variant", "secondary")
    expect(unreadBadge).toHaveClass("bg-warning/10")
    expect(readBadge).toHaveAttribute("data-variant", "default")
    expect(readBadge).not.toHaveClass("bg-warning/10")
  })
})
