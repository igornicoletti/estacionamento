import {
  act,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

function deferred<T>() {
  let resolvePromise: ((value: T) => void) | null = null

  const promise = new Promise<T>((nextResolve) => {
    resolvePromise = nextResolve
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

describe("useAsyncSnapshot", () => {
  it("carrega dados iniciais e permite refetch", async () => {
    const loadData = vi
      .fn<() => Promise<number[]>>()
      .mockResolvedValueOnce([1, 2])
      .mockResolvedValueOnce([3])

    const { result } = renderHook(() =>
      useAsyncSnapshot<number[]>({
        initialData: [],
        loadData,
        errorMessage: "Falha ao carregar.",
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual([1, 2])
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toEqual([3])
    expect(result.current.error).toBeNull()
    expect(loadData).toHaveBeenCalledTimes(2)
  })

  it("normaliza erro com fallback quando a excecao nao eh Error", async () => {
    const loadData = vi.fn<() => Promise<number[]>>().mockRejectedValue("erro")

    const { result } = renderHook(() =>
      useAsyncSnapshot<number[]>({
        initialData: [],
        loadData,
        errorMessage: "Falha ao carregar.",
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error?.message).toBe("Falha ao carregar.")
    })
  })

  it("ignora atualizacao de estado apos unmount durante carregamento", async () => {
    const pendingLoad = deferred<number[]>()
    const loadData = vi.fn<() => Promise<number[]>>().mockReturnValue(pendingLoad.promise)
    const renderSpy = vi.fn()

    function Harness() {
      const snapshot = useAsyncSnapshot<number[]>({
        initialData: [],
        loadData,
        errorMessage: "Falha ao carregar.",
      })

      renderSpy(snapshot.data.length, snapshot.isLoading)
      return null
    }

    const { unmount } = render(<Harness />)
    expect(loadData).toHaveBeenCalledTimes(1)

    const callCountBeforeUnmount = renderSpy.mock.calls.length
    unmount()

    await act(async () => {
      pendingLoad.resolve([1, 2, 3])
      await Promise.resolve()
    })

    expect(renderSpy.mock.calls.length).toBe(callCountBeforeUnmount)
  })
})
