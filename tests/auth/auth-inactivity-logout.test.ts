import * as React from "react"
import { act, render, renderHook, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AuthSessionExpiredDialog } from "@/features/auth/components/auth-session-expired-dialog"
import { AUTH_INACTIVITY_EXPIRED_STORAGE_KEY } from "@/features/auth/components/auth-inactivity-guard"
import { useInactivityLogout } from "@/features/auth/hooks/auth-use-inactivity-logout"

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

  it("uses 45 minutes as the default inactivity timeout", () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()

    const { result } = renderHook(() =>
      useInactivityLogout({
        enabled: true,
        onTimeout,
      })
    )

    act(() => {
      vi.advanceTimersByTime(44 * 60_000 - 1)
    })

    expect(result.current.isWarningOpen).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current.isWarningOpen).toBe(true)
    expect(result.current.secondsRemaining).toBe(60)
  })

  it("shows a one-shot alert dialog when redirected after inactivity logout", () => {
    window.sessionStorage.setItem(AUTH_INACTIVITY_EXPIRED_STORAGE_KEY, "1")

    render(React.createElement(AuthSessionExpiredDialog))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByText("Sessão encerrada")).toBeInTheDocument()
    expect(window.sessionStorage.getItem(AUTH_INACTIVITY_EXPIRED_STORAGE_KEY)).toBeNull()
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
