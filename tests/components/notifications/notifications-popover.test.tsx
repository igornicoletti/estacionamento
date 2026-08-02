import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { NotificationsPopover } from "@/components/notifications"
import { NotificationsProvider } from "@/features/notifications/context/notifications-provider"
import { formatDateTime } from "@/lib"

describe("NotificationsPopover", () => {
  it("abre o popover e exibe as ações principais", async () => {
    render(
      <MemoryRouter>
        <NotificationsProvider>
          <NotificationsPopover />
        </NotificationsProvider>
      </MemoryRouter>
    )

    fireEvent.click(
      screen.getByRole("button", { name: /Abrir painel de notificações/ })
    )

    await waitFor(() => {
      expect(screen.getByText("Notificações")).toBeInTheDocument()
    })

    expect(
      screen.getByText("Notificações").closest('[data-slot="popover-title"]')
    ).toHaveClass("text-base", "font-semibold")
    expect(
      screen.getByText(formatDateTime("2026-07-01T08:25:00.000Z"))
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Marcar todas como lidas" })
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-notification-type-icon="sync"]')
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-notification-type-icon="security"]')
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver todas" })).toBeInTheDocument()
  })
})
