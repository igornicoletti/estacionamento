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

describe("NotificationsPopover", () => {
  it("abre o popover e exibe as acoes principais de notificacoes", async () => {
    render(
      <MemoryRouter>
        <NotificationsPopover />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: "Abrir notificações" }))

    await waitFor(() => {
      expect(screen.getByText("Notificações")).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: "Marcar todas como lidas" })
    ).toBeInTheDocument()

    expect(
      screen.getByRole("link", { name: "Ver todas" })
    ).toBeInTheDocument()
  })
})
