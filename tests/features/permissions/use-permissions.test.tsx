import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  resetPermissionsGateway,
  setPermissionsGateway,
} from "@/features/permissions/gateways/permissions-gateway"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import {
  createPermissionMatrixPayload,
  createPermissionWireRow,
} from "../../helpers/permissions-memory-gateway"

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, reject, resolve }
}

describe("usePermissions", () => {
  afterEach(() => {
    resetPermissionsGateway()
  })

  it("does not let an older request overwrite a newer retry", async () => {
    const initialRequest = createDeferred<ReturnType<typeof createPermissionMatrixPayload>>()
    const retryRequest = createDeferred<ReturnType<typeof createPermissionMatrixPayload>>()
    const listMatrix = vi
      .fn()
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(retryRequest.promise)
    setPermissionsGateway({ listMatrix })
    const { result } = renderHook(() => usePermissions())

    await waitFor(() => expect(listMatrix).toHaveBeenCalledOnce())
    let retryPromise: Promise<void>
    act(() => {
      retryPromise = result.current.refetch()
    })

    retryRequest.resolve(
      createPermissionMatrixPayload({
        permissions: [createPermissionWireRow({ key: "users.read" })],
      })
    )
    await act(async () => retryPromise)
    expect(result.current.data.permissions[0]?.key).toBe("users.read")

    await act(async () => {
      initialRequest.resolve(createPermissionMatrixPayload())
      await initialRequest.promise
    })
    expect(result.current.data.permissions[0]?.key).toBe("users.read")
  })

  it("preserves the valid snapshot when a retry fails", async () => {
    const listMatrix = vi
      .fn()
      .mockResolvedValueOnce(createPermissionMatrixPayload())
      .mockRejectedValueOnce(new Error("backend indisponível"))
    setPermissionsGateway({ listMatrix })
    const { result } = renderHook(() => usePermissions())

    await waitFor(() => {
      expect(result.current.data.permissions[0]?.key).toBe("audit.read")
    })
    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data.permissions[0]?.key).toBe("audit.read")
    expect(result.current.error).toEqual(new Error("backend indisponível"))
  })
})
