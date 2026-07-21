import { AlertTriangleIcon } from "lucide-react"
import * as React from "react"

import { PageHeader, PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useNotifications } from "@/features/notifications"

import { SecurityChangePasswordDialog, SecuritySummaryCard } from "../components"
import { securityCopy } from "../constants/security-copy"
import { useSecurityPasswordChange } from "../hooks/use-security-password-change"
import { useSecurity } from "../hooks/use-security"
import { getRecentSecurityEvents } from "../model"

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-64 flex-1 items-center justify-center rounded-lg border bg-background p-6 text-foreground">
      {children}
    </section>
  )
}

export function SecurityRoute() {
  const { error, isLoading, profile, refreshProfile, registerPasskey, security } = useSecurity()
  const notifications = useNotifications()
  const { changePassword, isChangingPassword } = useSecurityPasswordChange()
  const [isRegisteringPasskey, setIsRegisteringPasskey] = React.useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false)
  const activeRegistrationRef = React.useRef<ReturnType<typeof registerPasskey> | null>(null)
  const securityEvents = React.useMemo(
    () => getRecentSecurityEvents(notifications.data),
    [notifications.data]
  )

  async function handleRegisterPasskey() {
    if (activeRegistrationRef.current) {
      return activeRegistrationRef.current
    }

    setIsRegisteringPasskey(true)
    activeRegistrationRef.current = notify.track(registerPasskey(), securityCopy.feedback.passkey)

    try {
      return await activeRegistrationRef.current
    } finally {
      activeRegistrationRef.current = null
      setIsRegisteringPasskey(false)
    }
  }

  async function handleChangePassword(input: { currentPassword: string; newPassword: string }) {
    await changePassword(input)
    setIsPasswordDialogOpen(false)
  }

  if (isLoading) {
    return (
      <PageSection>
        <PageHeader title={securityCopy.page.title} subtitle={securityCopy.page.subtitle} />
        <CenteredState>
          <Spinner className="size-6 text-primary" aria-label={securityCopy.page.title} />
        </CenteredState>
      </PageSection>
    )
  }

  if (error && !profile) {
    return (
      <PageSection>
        <PageHeader title={securityCopy.page.title} subtitle={securityCopy.page.subtitle} />
        <CenteredState>
          <AppEmptyState
            media={<AlertTriangleIcon />}
            title={securityCopy.error.title}
            description={securityCopy.empty.description}
            actions={<Button type="button" variant="secondary" size="lg" onClick={() => { void refreshProfile() }}>{securityCopy.error.action}</Button>}
          />
        </CenteredState>
      </PageSection>
    )
  }

  if (!profile) {
    return (
      <PageSection>
        <PageHeader title={securityCopy.page.title} subtitle={securityCopy.page.subtitle} />
        <CenteredState>
          <AppEmptyState
            title={securityCopy.empty.title}
            description={securityCopy.empty.description}
            actions={<Button type="button" variant="secondary" size="lg" onClick={() => { void refreshProfile() }}>{securityCopy.empty.action}</Button>}
          />
        </CenteredState>
      </PageSection>
    )
  }

  return (
    <PageSection className="w-full pb-6">
      <PageHeader title={securityCopy.page.title} subtitle={securityCopy.page.subtitle} />

      <div className="grid gap-4">
        {error ? (
          <Alert className="border-destructive/30 bg-destructive/5 text-foreground">
            <AlertTriangleIcon className="text-destructive" aria-hidden="true" />
            <AlertTitle>{securityCopy.error.noticeTitle}</AlertTitle>
            <AlertDescription>{securityCopy.feedback.passkey.error}</AlertDescription>
          </Alert>
        ) : null}

        <SecuritySummaryCard
          security={security}
          events={securityEvents}
          eventsError={notifications.error}
          isEventsLoading={notifications.isLoading}
          isRegisteringPasskey={isRegisteringPasskey}
          onOpenChangePassword={() => setIsPasswordDialogOpen(true)}
          onRegisterPasskey={handleRegisterPasskey}
        />
      </div>

      <SecurityChangePasswordDialog
        open={isPasswordDialogOpen}
        isSaving={isChangingPassword}
        onOpenChange={setIsPasswordDialogOpen}
        onSubmit={handleChangePassword}
      />
    </PageSection>
  )
}

export default SecurityRoute
