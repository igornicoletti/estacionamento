import { ClockIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { authCopy } from "@/features/auth/auth-copy"
import { useAuthSession } from "@/features/auth/hooks"
import { useInactivityLogout } from "@/features/auth/hooks/auth-use-inactivity-logout"

const APP_INACTIVITY_EXPIRED_STORAGE_KEY = "rmc.auth.inactivity-expired"

export function markAppInactivitySessionExpired() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(APP_INACTIVITY_EXPIRED_STORAGE_KEY, "1")
}

export function consumeAppInactivitySessionExpired() {
  if (typeof window === "undefined") {
    return false
  }

  const hasExpired =
    window.sessionStorage.getItem(APP_INACTIVITY_EXPIRED_STORAGE_KEY) === "1"

  if (hasExpired) {
    window.sessionStorage.removeItem(APP_INACTIVITY_EXPIRED_STORAGE_KEY)
  }

  return hasExpired
}

export function AppInactivityGuard() {
  const navigate = useNavigate()
  const { isAuthenticated, signOut } = useAuthSession()
  const copy = authCopy.inactivity

  async function signOutAndRedirect() {
    await signOut()
    void navigate("/login", { replace: true })
  }

  function handleSignOutClick() {
    void signOutAndRedirect()
  }

  function handleInactiveTimeout() {
    markAppInactivitySessionExpired()
    void signOutAndRedirect()
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
    <AppAlertDialog
      open={isWarningOpen}
      title={copy.title}
      description={`${copy.description} ${copy.secondsRemaining(secondsRemaining)}`}
      media={<ClockIcon />}
      showFooter
      footer={
        <>
          <Button type="button" variant="outline" size="lg" onClick={handleSignOutClick}>
            {copy.signOutNow}
          </Button>
          <Button type="button" size="lg" onClick={continueSession}>
            {copy.continueSession}
          </Button>
        </>
      }
    />
  )
}
