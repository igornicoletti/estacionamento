import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { MemoryRouter } from "react-router"
import {
  describe,
  expect,
  it,
} from "vitest"

import { NotificationsPopover } from "@/components/sidebar/sidebar-notifications-popover"
import { NotificationsProvider } from "@/features/notifications/context/notifications-provider"

describe("NotificationsPopover", () => {
  it("abre o popover e exibe as acoes principais de notificacoes", async () => {
    render(
      <MemoryRouter>
        <NotificationsProvider>
          <NotificationsPopover />
        </NotificationsProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: "Abrir painel de notificações" }))

    await waitFor(() => {
      expect(screen.getByText("Notificações")).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: "Marcar todas como lidas" })
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-notification-type-icon="sync"]')
    ).toBeInTheDocument()
    expect(
      document.querySelector('[data-notification-type-icon="security"]')
    ).toBeInTheDocument()

    expect(
      screen.getByRole("link", { name: "Ver todas" })
    ).toBeInTheDocument()
  })
})
