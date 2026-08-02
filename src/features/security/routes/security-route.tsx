import { AlertTriangleIcon } from "lucide-react"
import * as React from "react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppPage } from "@/components/shared/app-page"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import {
  SecurityChangePasswordDialog,
  SecurityLoginsDialog,
  SecurityMfaDialog,
  SecuritySummaryCard,
} from "../components"
import { securityCopy } from "../constants/security-copy"
import { useSecurityEvents } from "../hooks/use-security-events"
import { useSecurityPasswordChange } from "../hooks/use-security-password-change"
import { useSecurity } from "../hooks/use-security"
import {
  cancelSecurityTotpEnrollment,
  enrollSecurityTotp,
  reviewRecentSecurityLogins,
  trustCurrentSecurityDevice,
  verifySecurityTotp,
} from "../services/security-posture-service"
import { type SecurityMfaEnrollment } from "../types/security-types"

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-64 flex-1 items-center justify-center rounded-lg border bg-background p-6 text-foreground">
      {children}
    </section>
  )
}

export function SecurityRoute() {
  const {
    error,
    isLoading,
    isPostureLoading,
    postureError,
    profile,
    refreshProfile,
    refreshSecurity,
    registerPasskey,
    security,
  } = useSecurity()
  const securityEvents = useSecurityEvents(profile?.authUserId)
  const { changePassword, isChangingPassword } = useSecurityPasswordChange()
  const [isRegisteringPasskey, setIsRegisteringPasskey] = React.useState(false)
  const [isConfiguringMfa, setIsConfiguringMfa] = React.useState(false)
  const [isReviewingLogins, setIsReviewingLogins] = React.useState(false)
  const [isTrustingDevice, setIsTrustingDevice] = React.useState(false)
  const [isMfaDialogOpen, setIsMfaDialogOpen] = React.useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false)
  const [isLoginsDialogOpen, setIsLoginsDialogOpen] = React.useState(false)
  const [mfaEnrollment, setMfaEnrollment] =
    React.useState<SecurityMfaEnrollment | null>(null)
  const [mfaError, setMfaError] = React.useState<string | null>(null)
  const activeRegistrationRef = React.useRef<ReturnType<typeof registerPasskey> | null>(null)
  async function handleRegisterPasskey() {
    if (activeRegistrationRef.current) {
      return activeRegistrationRef.current
    }

    setIsRegisteringPasskey(true)
    activeRegistrationRef.current = notify.track(registerPasskey(), securityCopy.feedback.passkey)

    try {
      const passkey = await activeRegistrationRef.current
      await Promise.all([
        refreshSecurity(),
        securityEvents.refetch(),
      ])
      return passkey
    } finally {
      activeRegistrationRef.current = null
      setIsRegisteringPasskey(false)
    }
  }

  async function handleChangePassword(input: { currentPassword: string; newPassword: string }) {
    await changePassword(input)
    setIsPasswordDialogOpen(false)
  }

  function handleOpenMfa() {
    setMfaError(null)
    setIsMfaDialogOpen(true)
  }

  async function handleEnrollMfa() {
    if (isConfiguringMfa) return false

    setIsConfiguringMfa(true)
    setMfaError(null)

    try {
      setMfaEnrollment(await enrollSecurityTotp())
      return true
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : securityCopy.feedback.mfa.error
      )
      return false
    } finally {
      setIsConfiguringMfa(false)
    }
  }

  async function handleResetMfa() {
    if (isConfiguringMfa) return false

    const enrollment = mfaEnrollment
    setMfaError(null)

    if (!enrollment) {
      return true
    }

    setIsConfiguringMfa(true)

    try {
      await cancelSecurityTotpEnrollment(enrollment.factorId)
      setMfaEnrollment(null)
      return true
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : securityCopy.feedback.mfa.cancelError
      )
      return false
    } finally {
      setIsConfiguringMfa(false)
    }
  }

  async function handleCloseMfa() {
    if (await handleResetMfa()) {
      setIsMfaDialogOpen(false)
    }
  }

  async function handleVerifyMfa(code: string) {
    if (!mfaEnrollment || isConfiguringMfa) return

    setIsConfiguringMfa(true)
    setMfaError(null)

    try {
      await verifySecurityTotp(mfaEnrollment.factorId, code)
      await Promise.all([
        refreshSecurity(),
        securityEvents.refetch(),
      ])
      setMfaEnrollment(null)
      setIsMfaDialogOpen(false)
      notify.success(securityCopy.feedback.mfa.success)
    } catch (caughtError) {
      setMfaError(
        caughtError instanceof Error
          ? caughtError.message
          : securityCopy.feedback.mfa.error
      )
    } finally {
      setIsConfiguringMfa(false)
    }
  }

  async function handleReviewLogins() {
    if (isReviewingLogins) return

    setIsReviewingLogins(true)

    try {
      await reviewRecentSecurityLogins()
      await Promise.all([
        refreshSecurity(),
        securityEvents.refetch(),
      ])
      setIsLoginsDialogOpen(false)
      notify.success(securityCopy.feedback.reviewLogins.success)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : securityCopy.feedback.reviewLogins.error
      )
    } finally {
      setIsReviewingLogins(false)
    }
  }

  async function handleTrustDevice() {
    if (isTrustingDevice) return

    if (!security.posture.mfaConfigured) {
      notify.info(securityCopy.feedback.trustDevice.mfaRequired)
      return
    }

    setIsTrustingDevice(true)

    try {
      await trustCurrentSecurityDevice()
      await Promise.all([
        refreshSecurity(),
        securityEvents.refetch(),
      ])
      notify.success(securityCopy.feedback.trustDevice.success)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : securityCopy.feedback.trustDevice.error
      )
    } finally {
      setIsTrustingDevice(false)
    }
  }

  if (isLoading || isPostureLoading) {
    return (
      <AppPage title={securityCopy.page.title} subtitle={securityCopy.page.subtitle}>
        <CenteredState>
          <Spinner className="size-6 text-primary" aria-label={securityCopy.page.title} />
        </CenteredState>
      </AppPage>
    )
  }

  if (error && !profile) {
    return (
      <AppPage title={securityCopy.page.title} subtitle={securityCopy.page.subtitle}>
        <CenteredState>
          <AppEmptyState
            media={<AlertTriangleIcon />}
            title={securityCopy.error.title}
            description={securityCopy.empty.description}
            actions={<Button type="button" variant="secondary" size="lg" onClick={() => { void refreshProfile() }}>{securityCopy.error.action}</Button>}
          />
        </CenteredState>
      </AppPage>
    )
  }

  if (!profile) {
    return (
      <AppPage title={securityCopy.page.title} subtitle={securityCopy.page.subtitle}>
        <CenteredState>
          <AppEmptyState
       media={<AlertTriangleIcon aria-hidden="true" />}
            title={securityCopy.empty.title}
            description={securityCopy.empty.description}
            actions={<Button type="button" variant="secondary" size="lg" onClick={() => { void refreshProfile() }}>{securityCopy.empty.action}</Button>}
          />
        </CenteredState>
      </AppPage>
    )
  }

  if (postureError) {
    return (
      <AppPage title={securityCopy.page.title} subtitle={securityCopy.page.subtitle}>
        <CenteredState>
          <AppEmptyState
            media={<AlertTriangleIcon aria-hidden="true" />}
            title={securityCopy.error.title}
            description={postureError.message}
            actions={(
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => void refreshSecurity()}
              >
                {securityCopy.error.action}
              </Button>
            )}
          />
        </CenteredState>
      </AppPage>
    )
  }

  return (
    <AppPage
      className="w-full pb-6"
      title={securityCopy.page.title}
      subtitle={securityCopy.page.subtitle}
    >
      <SecuritySummaryCard
        security={security}
        events={securityEvents.data}
        eventsError={securityEvents.error}
        isEventsLoading={securityEvents.isLoading}
        isConfiguringMfa={isConfiguringMfa}
        isRegisteringPasskey={isRegisteringPasskey}
        isTrustingDevice={isTrustingDevice}
        onOpenChangePassword={() => setIsPasswordDialogOpen(true)}
        onOpenLogins={() => setIsLoginsDialogOpen(true)}
        onOpenMfa={() => {
          handleOpenMfa()
        }}
        onRegisterPasskey={() => {
          void handleRegisterPasskey()
        }}
        onTrustDevice={handleTrustDevice}
      />

      {isMfaDialogOpen ? (
        <SecurityMfaDialog
          open
          enrollment={mfaEnrollment}
          error={mfaError}
          isSaving={isConfiguringMfa}
          onClose={handleCloseMfa}
          onEnroll={handleEnrollMfa}
          onReset={handleResetMfa}
          onVerify={handleVerifyMfa}
        />
      ) : null}

      <SecurityLoginsDialog
        open={isLoginsDialogOpen}
        sessions={security.posture.sessions}
        isSaving={isReviewingLogins}
        onOpenChange={setIsLoginsDialogOpen}
        onReview={handleReviewLogins}
      />

      <SecurityChangePasswordDialog
        open={isPasswordDialogOpen}
        isSaving={isChangingPassword}
        onOpenChange={setIsPasswordDialogOpen}
        onSubmit={handleChangePassword}
      />
    </AppPage>
  )
}

export default SecurityRoute
