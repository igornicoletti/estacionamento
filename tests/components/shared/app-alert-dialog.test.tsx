import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AppAlertDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"

describe("AppAlertDialog", () => {
  it("centraliza o layout compacto e usa ação destrutiva", async () => {
    const onAction = vi.fn(() => Promise.resolve())

    render(
      <AppAlertDialog
        size="sm"
        tone="destructive"
        title="Excluir registro"
        description="Esta ação não pode ser desfeita."
        actionLabel="Excluir"
        onAction={onAction}
        trigger={<Button type="button">Abrir</Button>}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Abrir" }))

    const title = await screen.findByRole("heading", { name: "Excluir registro" })
    expect(title.parentElement).toHaveClass("items-center")
    expect(title.parentElement).toHaveClass("text-center")

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1))
  })

  it("mantém o layout padrão horizontal quando existe mídia", async () => {
    render(
      <AppAlertDialog
        title="Sessão prestes a expirar"
        description="Continue para manter o acesso."
        trigger={<Button type="button">Abrir sessão</Button>}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Abrir sessão" }))

    const title = await screen.findByRole("heading", {
      name: "Sessão prestes a expirar",
    })
    expect(title.parentElement).toHaveClass(
      "grid-cols-[auto_minmax(0,1fr)]"
    )
  })
})
