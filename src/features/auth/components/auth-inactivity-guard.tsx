import { AuthInactivityDialog } from "../components/auth-inactivity-dialog"
import { useAuthSession } from "../context/auth-session-context"
import { useInactivityLogout } from "../hooks/auth-use-inactivity-logout"

export const AUTH_INACTIVITY_EXPIRED_STORAGE_KEY =
  "rmc.auth.inactivity-expired"

export function markInactivitySessionExpired() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(AUTH_INACTIVITY_EXPIRED_STORAGE_KEY, "1")
}

export function consumeInactivitySessionExpired() {
  if (typeof window === "undefined") {
    return false
  }

  const hasExpired = window.sessionStorage.getItem(
    AUTH_INACTIVITY_EXPIRED_STORAGE_KEY
  ) === "1"

  if (hasExpired) {
    window.sessionStorage.removeItem(AUTH_INACTIVITY_EXPIRED_STORAGE_KEY)
  }

  return hasExpired
}

/**
 * Renders nothing visible on its own — mounts the inactivity tracker and
 * warning dialog only while the user is authenticated, and signs the user
 * out automatically once the countdown reaches zero.
 */
export function AuthInactivityGuard() {
  const { isAuthenticated, signOut } = useAuthSession()

  const handleInactiveTimeout = () => {
    markInactivitySessionExpired()
    void signOut()
  }

  const { isWarningOpen, secondsRemaining, continueSession } =
    useInactivityLogout({
      enabled: isAuthenticated,
      onTimeout: handleInactiveTimeout,
    })

  if (!isAuthenticated) {
    return null
  }

  return (
    <AuthInactivityDialog
      open={isWarningOpen}
      secondsRemaining={secondsRemaining}
      onContinueSession={continueSession}
      onSignOutNow={() => {
        void signOut()
      }}
    />
  )
}
