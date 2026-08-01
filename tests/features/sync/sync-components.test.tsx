import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SyncDialog } from "@/features/sync/components/sync-dialog"
import { SyncHistorySheet } from "@/features/sync/components/sync-history-sheet"
import {
  resetSyncGateway,
  setSyncGateway,
} from "@/features/sync/gateways/sync-gateway"
import { type SyncPhaseResult } from "@/features/sync/model/sync-types"
import { createUnitSyncRun } from "../../helpers/sync-memory-gateway"

afterEach(() => resetSyncGateway())

describe("sync components", () => {
  it("renders history as an expandable timeline", async () => {
    setSyncGateway({
      listHistory: () =>
        Promise.resolve({
          state: { last_cursor: null },
          unitRuns: [createUnitSyncRun()],
        }),
      runPhase: vi.fn(),
    })

    render(
      <SyncHistorySheet open resource="units" onOpenChange={vi.fn()} />
    )

    expect(
      await screen.findByRole("heading", {
        name: "Histórico de sincronizações",
      })
    ).toBeInTheDocument()

    const status = await screen.findByText("Concluída")
    const trigger = status.closest("button")
    expect(trigger).not.toBeNull()
    fireEvent.click(trigger as HTMLButtonElement)

    expect(await screen.findByText("Recebidos")).toBeInTheDocument()
    expect(screen.getByText("Criados")).toBeInTheDocument()
  })

  it("blocks dismissal while running and reports the verified result", async () => {
    const onOpenChange = vi.fn()
    let resolveSynchronized: () => void = () => undefined
    const synchronized = new Promise<void>((resolve) => {
      resolveSynchronized = resolve
    })
    const onSynchronized = vi.fn(() => {
      resolveSynchronized()
    })
    const baselineRun = createUnitSyncRun()
    const completedRun = createUnitSyncRun({
      id: "33333333-3333-4333-8333-333333333333",
    })
    let completed = false
    let resolvePhase: (result: SyncPhaseResult) => void = () => undefined
    const phase = new Promise<SyncPhaseResult>((resolve) => {
      resolvePhase = resolve
    })

    setSyncGateway({
      listHistory: () =>
        Promise.resolve({
          state: { last_cursor: null },
          unitRuns: completed
            ? [completedRun, baselineRun]
            : [baselineRun],
        }),
      runPhase: () => phase,
    })

    const { rerender } = render(
      <SyncDialog
        open
        resource="units"
        onOpenChange={onOpenChange}
        onSynchronized={onSynchronized}
      />
    )

    expect(await screen.findByText("Última sincronização")).toBeInTheDocument()
    expect(screen.getByText("12 s")).toBeInTheDocument()
    expect(screen.getByText("Incremental")).toBeInTheDocument()
    expect(screen.getByText("Manual")).toBeInTheDocument()
    expect(
      document.querySelector('[data-sync-resource-icon="units"]')
    ).toBeInTheDocument()
    expect(screen.queryByText(/bloqueará novas sincronizações/i)).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sincronizar" }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(
      await screen.findByText("Sincronização em andamento")
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onOpenChange).not.toHaveBeenCalled()

    await act(async () => {
      completed = true
      resolvePhase({
        runId: completedRun.id,
        status: "success",
        message: completedRun.message,
      })
      await synchronized
    })

    expect(
      await screen.findByText("Sincronização concluída")
    ).toBeInTheDocument()
    expect(onSynchronized).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    rerender(
      <SyncDialog
        open={false}
        resource="units"
        onOpenChange={onOpenChange}
        onSynchronized={onSynchronized}
      />
    )
  })

  it("does not show success when the remote phase fails", async () => {
    setSyncGateway({
      listHistory: () =>
        Promise.resolve({ state: { last_cursor: null }, unitRuns: [] }),
      runPhase: () =>
        Promise.resolve({
          runId: null,
          status: "failed",
          message: "A integração não respondeu.",
        }),
    })

    render(
      <SyncDialog open resource="units" onOpenChange={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar" }))

    expect(
      await screen.findByText("Não foi possível concluir a sincronização")
    ).toBeInTheDocument()
    expect(screen.queryByText("Sincronização concluída")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument()
  })
})
