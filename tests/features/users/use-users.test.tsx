import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  configureUnitsGateway,
  resetUnitsGateway,
} from "@/features/units"
import {
  resetUsersGateway,
  setUsersGateway,
} from "@/features/users/gateways/users-gateway"
import { type UsersGateway } from "@/features/users/gateways/users-gateway-contracts"
import { useUsers } from "@/features/users/hooks/use-users"
import { type UserRecord } from "@/features/users"
import { createMemoryUsersGateway } from "../../helpers/users-memory-gateway"

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

function createUser(id: string, name: string): UserRecord {
  return {
    authUserId: `auth-${id}`,
    cpf: "529.982.247-25",
    email: `${id}@example.com`,
    id,
    lastAccessAt: null,
    lockedUntil: null,
    name,
    passkeyCount: 0,
    passkeyStatus: "inactive",
    phoneMasked: "(11) 98888-7777",
    role: "owner",
    status: "active",
    unitId: null,
    unitName: null,
  }
}

describe("useUsers", () => {
  beforeEach(() => {
    configureUnitsGateway({
      listUnitsPayload: () => Promise.resolve([]),
    })
  })

  afterEach(() => {
    resetUnitsGateway()
    resetUsersGateway()
  })

  it("keeps the newest load when concurrent requests finish out of order", async () => {
    const firstLoad = deferred<UserRecord[]>()
    const secondLoad = deferred<UserRecord[]>()
    const list = vi
      .fn<UsersGateway["list"]>()
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise)
    const gateway = createMemoryUsersGateway()
    gateway.list = list
    setUsersGateway(gateway)

    const { result } = renderHook(() => useUsers())

    await waitFor(() => {
      expect(list).toHaveBeenCalledTimes(1)
    })

    let refetchPromise: Promise<void> | undefined
    act(() => {
      refetchPromise = result.current.refetch()
    })

    secondLoad.resolve([createUser("USR-002", "Usuário mais recente")])
    await act(async () => {
      await refetchPromise
    })

    firstLoad.resolve([createUser("USR-001", "Usuário obsoleto")])
    await act(async () => {
      await firstLoad.promise
    })

    expect(result.current.data.map((user) => user.id)).toEqual(["USR-002"])
    expect(result.current.isLoading).toBe(false)
  })

  it("does not contact the backend while the users tab is disabled", async () => {
    const gateway = createMemoryUsersGateway()
    const list = vi.spyOn(gateway, "list")
    setUsersGateway(gateway)

    const { result } = renderHook(() => useUsers({ enabled: false }))

    await act(async () => {
      await result.current.refetch()
    })

    expect(list).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })
})
