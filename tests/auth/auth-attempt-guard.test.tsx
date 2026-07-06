import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useAttemptGuard } from "@/features/auth/hooks"

afterEach(() => {
  vi.useRealTimers()
})

describe("useAttemptGuard", () => {
  it("blocks after max attempts and unlocks after cooldown", () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useAttemptGuard())

    act(() => {
      for (let i = 0; i < result.current.maxAttempts; i += 1) {
        result.current.recordAttempt()
      }
    })

    expect(result.current.isBlocked).toBe(true)
    expect(result.current.isLocked).toBe(true)
    expect(result.current.remainingSeconds).toBeGreaterThan(0)

    act(() => {
      vi.advanceTimersByTime(61_000)
    })

    expect(result.current.isBlocked).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.attempts).toBe(0)
  })

  it("resets immediately when resetAttempts is called", () => {
    const { result } = renderHook(() => useAttemptGuard())

    act(() => {
      result.current.recordAttempt()
      result.current.recordAttempt()
      result.current.resetAttempts()
    })

    expect(result.current.attempts).toBe(0)
    expect(result.current.isBlocked).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
  })
})
