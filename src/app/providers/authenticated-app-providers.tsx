import type { ReactNode } from "react"

import { SelectedUnitProvider } from "@/components/shared/app-unit-selector"
import { NotificationsProvider } from "@/features/notifications"

interface AuthenticatedAppProvidersProps {
  children: ReactNode
}

export function AuthenticatedAppProviders({
  children,
}: AuthenticatedAppProvidersProps) {
  return (
    <SelectedUnitProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </SelectedUnitProvider>
  )
}
