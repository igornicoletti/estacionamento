import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useInactivityLogout } from "@/features/auth/hooks"

afterEach(() => {
  vi.useRealTimers()
})

describe("useInactivityLogout", () => {
  it("opens the warning after the idle period, then times out and signs out", () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()

    const { result } = renderHook(() =>
      useInactivityLogout({
        enabled: true,
        onTimeout,
        idleTimeoutMs: 10_000,
        warningDurationMs: 4_000,
      })
    )

    expect(result.current.isWarningOpen).toBe(false)

    act(() => {
      vi.advanceTimersByTime(6_000)
    })

    expect(result.current.isWarningOpen).toBe(true)
    expect(result.current.secondsRemaining).toBe(4)

    act(() => {
      vi.advanceTimersByTime(2_000)
    })

    expect(result.current.secondsRemaining).toBe(2)
    expect(onTimeout).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(2_000)
    })

    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it("resets the countdown when continueSession is called", () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()

    const { result } = renderHook(() =>
      useInactivityLogout({
        enabled: true,
        onTimeout,
        idleTimeoutMs: 10_000,
        warningDurationMs: 4_000,
      })
    )

    act(() => {
      vi.advanceTimersByTime(6_000)
    })

    expect(result.current.isWarningOpen).toBe(true)

    act(() => {
      result.current.continueSession()
    })

    expect(result.current.isWarningOpen).toBe(false)

    act(() => {
      vi.advanceTimersByTime(6_000)
    })

    expect(result.current.isWarningOpen).toBe(true)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it("does not arm timers while disabled", () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()

    const { result } = renderHook(() =>
      useInactivityLogout({
        enabled: false,
        onTimeout,
        idleTimeoutMs: 10_000,
        warningDurationMs: 4_000,
      })
    )

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.isWarningOpen).toBe(false)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
