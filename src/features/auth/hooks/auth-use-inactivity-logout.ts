import * as React from "react"

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60_000
const DEFAULT_WARNING_DURATION_MS = 60_000

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const

interface UseInactivityLogoutOptions {
  enabled: boolean
  onTimeout: () => void
  idleTimeoutMs?: number
  warningDurationMs?: number
}

/**
 * Tracks user activity (mouse/keyboard/touch/scroll) and triggers a
 * countdown warning before automatically signing the user out after a
 * period of inactivity. Once the warning is shown it requires an explicit
 * "continue session" action — passive activity (e.g. the mouse drifting)
 * does not silently dismiss it, matching common security-conscious UX.
 */
export function useInactivityLogout({
  enabled,
  onTimeout,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  warningDurationMs = DEFAULT_WARNING_DURATION_MS,
}: UseInactivityLogoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = React.useState(false)
  const [secondsRemaining, setSecondsRemaining] = React.useState(
    Math.ceil(warningDurationMs / 1000)
  )

  const warningTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const logoutTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const countdownIntervalRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const onTimeoutRef = React.useRef(onTimeout)

  React.useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const clearTimers = React.useCallback(() => {
    clearTimeout(warningTimerRef.current)
    clearTimeout(logoutTimerRef.current)
    clearInterval(countdownIntervalRef.current)
  }, [])

  /**
   * Arms the warning/logout timer chain without touching any state directly
   * — safe to call from a mount effect. State transitions only happen
   * inside the timer callbacks themselves (or via `scheduleTimers`, used
   * from event handlers such as user activity or "continue session").
   */
  const armTimers = React.useCallback(() => {
    clearTimers()

    const beforeWarningMs = Math.max(idleTimeoutMs - warningDurationMs, 0)

    warningTimerRef.current = setTimeout(() => {
      setIsWarningOpen(true)
      setSecondsRemaining(Math.ceil(warningDurationMs / 1000))

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((current) => Math.max(current - 1, 0))
      }, 1000)

      logoutTimerRef.current = setTimeout(() => {
        clearInterval(countdownIntervalRef.current)
        setIsWarningOpen(false)
        onTimeoutRef.current()
      }, warningDurationMs)
    }, beforeWarningMs)
  }, [clearTimers, idleTimeoutMs, warningDurationMs])

  const scheduleTimers = React.useCallback(() => {
    setIsWarningOpen(false)
    setSecondsRemaining(Math.ceil(warningDurationMs / 1000))
    armTimers()
  }, [armTimers, warningDurationMs])

  const handleActivity = React.useCallback(() => {
    setIsWarningOpen((currentlyWarning) => {
      if (currentlyWarning) {
        return currentlyWarning
      }

      scheduleTimers()
      return currentlyWarning
    })
  }, [scheduleTimers])

  const continueSession = React.useCallback(() => {
    scheduleTimers()
  }, [scheduleTimers])

  React.useEffect(() => {
    if (!enabled) {
      clearTimers()
      return
    }

    armTimers()

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true })
    }

    return () => {
      clearTimers()
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity)
      }
    }
  }, [enabled, armTimers, handleActivity, clearTimers])

  return {
    isWarningOpen,
    secondsRemaining,
    continueSession,
  }
}
