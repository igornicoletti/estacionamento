import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  resetAuditGateway,
  setAuditGateway,
} from "@/features/audit/gateways/audit-gateway"
import { type AuditGatewayResult } from "@/features/audit/gateways/audit-gateway-contracts"
import { useAudit } from "@/features/audit/hooks/use-audit"
import { createAuditEventRow } from "../../helpers/audit-memory-gateway"

function deferred<T>() {
  let resolvePromise: ((value: T) => void) | null = null

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve(value: T) {
      if (!resolvePromise) {
        throw new Error("Promise ainda não inicializada.")
      }

      resolvePromise(value)
    },
  }
}

describe("useAudit", () => {
  afterEach(() => {
    resetAuditGateway()
  })

  it("keeps the newest request when concurrent loads finish out of order", async () => {
    const firstLoad = deferred<AuditGatewayResult>()
    const secondLoad = deferred<AuditGatewayResult>()
    const listEvents = vi
      .fn<() => Promise<AuditGatewayResult>>()
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise)
    setAuditGateway({ listEvents })

    const { result } = renderHook(() => useAudit())

    await waitFor(() => {
      expect(listEvents).toHaveBeenCalledTimes(1)
    })

    let refetchPromise: Promise<void> | undefined
    act(() => {
      refetchPromise = result.current.refetch()
    })

    secondLoad.resolve({
      isTruncated: true,
      rows: [
        createAuditEventRow({
          event: "client_synced",
          id: "00000000-0000-4000-8000-000000000002",
        }),
      ],
    })

    await act(async () => {
      await refetchPromise
    })

    expect(result.current.data[0]?.event).toBe("client_synced")
    expect(result.current.isTruncated).toBe(true)

    await act(async () => {
      firstLoad.resolve({
        isTruncated: false,
        rows: [createAuditEventRow({ event: "unit_synced" })],
      })
      await firstLoad.promise
    })

    expect(result.current.data[0]?.event).toBe("client_synced")
    expect(result.current.isTruncated).toBe(true)
  })

  it("preserves the previous snapshot when a refetch fails", async () => {
    const listEvents = vi
      .fn<() => Promise<AuditGatewayResult>>()
      .mockResolvedValueOnce({
        isTruncated: false,
        rows: [createAuditEventRow()],
      })
      .mockRejectedValueOnce(new Error("backend unavailable"))
    setAuditGateway({ listEvents })

    const { result } = renderHook(() => useAudit())

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.error?.message).toBe("backend unavailable")
    expect(result.current.isLoading).toBe(false)
  })
})
