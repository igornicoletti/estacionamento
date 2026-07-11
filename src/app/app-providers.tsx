import type { ReactNode } from "react"

import { ToastApp } from "@/components/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth/context"
import { NotificationsProvider } from "@/features/notifications"

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <NotificationsProvider>
          {children}
          <ToastApp />
        </NotificationsProvider>
      </AuthProvider>
    </TooltipProvider>
  )
}
