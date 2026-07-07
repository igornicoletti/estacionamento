import { notify } from "@/components/toast"

import { authCopy } from "../auth-copy"
import { AuthInactivityDialog } from "../components/auth-inactivity-dialog"
import { useAuthSession } from "../context/auth-session-context"
import { useInactivityLogout } from "../hooks/auth-use-inactivity-logout"

/**
 * Renders nothing visible on its own — mounts the inactivity tracker and
 * warning dialog only while the user is authenticated, and signs the user
 * out automatically once the countdown reaches zero.
 */
export function AuthInactivityGuard() {
  const { isAuthenticated, signOut } = useAuthSession()

  const handleInactiveTimeout = () => {
    void signOut()
    notify.info(authCopy.inactivity.loggedOutMessage)
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
