import type { ReactNode } from "react"

import { ToastApp } from "@/components/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth"
import { NotificationsProvider } from "@/features/notifications/context/notifications-provider"

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
        <ToastApp />
      </AuthProvider>
    </TooltipProvider>
  )
}
