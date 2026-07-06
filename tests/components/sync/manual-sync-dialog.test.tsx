import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ManualSyncDialog } from "@/components/ui/manual-sync-dialog"

describe("ManualSyncDialog", () => {
  it("renders confirm actions before starting", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ManualSyncDialog
        open
        phase="confirm"
        confirmTitle="Confirmar"
        confirmDescription="Deseja continuar?"
        runningTitle="Executando"
        runningDescription="Aguarde"
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    )

    expect(screen.getByRole("heading", { name: "Confirmar" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument()
  })

  it("hides actions while running", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ManualSyncDialog
        open
        phase="running"
        confirmTitle="Confirmar"
        confirmDescription="Deseja continuar?"
        runningTitle="Sincronizando"
        runningDescription="Aguarde"
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    )

    expect(screen.getByText("Sincronizando")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument()
  })
})
