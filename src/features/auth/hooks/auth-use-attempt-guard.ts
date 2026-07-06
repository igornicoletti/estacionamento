import * as React from "react"

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 60_000

interface AttemptGuardState {
  attempts: number
  lockedUntil: number | null
  remainingSeconds: number
}

function computeRemainingSeconds(lockedUntil: number | null) {
  if (!lockedUntil) {
    return 0
  }

  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1_000))
}

function createInitialState(): AttemptGuardState {
  return {
    attempts: 0,
    lockedUntil: null,
    remainingSeconds: 0,
  }
}

export function useAttemptGuard() {
  const [state, setState] = React.useState(createInitialState)

  React.useEffect(() => {
    if (!state.lockedUntil) {
      return
    }

    const interval = setInterval(() => {
      setState((current) => {
        if (!current.lockedUntil) {
          return current
        }

        const next = computeRemainingSeconds(current.lockedUntil)

        if (next <= 0) {
          return {
            attempts: 0,
            lockedUntil: null,
            remainingSeconds: 0,
          }
        }

        if (next === current.remainingSeconds) {
          return current
        }

        return { ...current, remainingSeconds: next }
      })
    }, 1_000)

    return () => {
      clearInterval(interval)
    }
  }, [state.lockedUntil])

  const recordAttempt = React.useCallback(() => {
    const now = Date.now()

    setState((current) => {
      const nextAttempts = current.attempts + 1
      const shouldLock = nextAttempts >= MAX_ATTEMPTS
      const lockedUntil = shouldLock ? now + LOCKOUT_DURATION_MS : null

      return {
        attempts: nextAttempts,
        lockedUntil,
        remainingSeconds: computeRemainingSeconds(lockedUntil),
      }
    })
  }, [])

  const resetAttempts = React.useCallback(() => {
    setState(createInitialState())
  }, [])

  const isBlocked = state.remainingSeconds > 0

  return {
    attempts: state.attempts,
    isBlocked,
    isLocked: isBlocked,
    maxAttempts: MAX_ATTEMPTS,
    recordAttempt,
    remainingSeconds: state.remainingSeconds,
    resetAttempts,
  }
}
