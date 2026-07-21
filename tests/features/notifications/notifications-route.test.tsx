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

    const destination = screen.getByRole("link", { name: "/clientes" })
    const description = screen.getByText("Clientes e unidades foram sincronizados com sucesso.")

    expect(destination).toHaveClass("hover:underline")
    expect(description).toHaveClass("truncate")

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

  it("shows only the status action that applies to each notification", async () => {
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

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da notificação")[0])

    expect(await screen.findByRole("menuitem", { name: "Marcar como lida" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Marcar como não lida" })).not.toBeInTheDocument()

    fireEvent.keyDown(document.body, { key: "Escape" })
    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da notificação")[2])

    expect(await screen.findByRole("menuitem", { name: "Marcar como não lida" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Marcar como lida" })).not.toBeInTheDocument()
  })
})
