import { AlertTriangleIcon } from "lucide-react"
import * as React from "react"

import { PageHeader, PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import { SecuritySummaryCard } from "../components/security-summary-card"
import { securityCopy } from "../constants/security-copy"
import { useSecurity } from "../hooks/use-security"

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-64 flex-1 items-center justify-center rounded-lg border bg-background p-6 text-foreground">
      {children}
    </section>
  )
}

export function SecurityRoute() {
  const { error, isLoading, profile, refreshProfile, registerPasskey, security } = useSecurity()
  const [isRegisteringPasskey, setIsRegisteringPasskey] = React.useState(false)
  const activeRegistrationRef = React.useRef<ReturnType<typeof registerPasskey> | null>(null)

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
          isRegisteringPasskey={isRegisteringPasskey}
          onRegisterPasskey={handleRegisterPasskey}
        />
      </div>
    </PageSection>
  )
}

export default SecurityRoute
