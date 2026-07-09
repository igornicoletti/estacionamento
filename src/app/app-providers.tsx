import * as React from "react"

import { ToastApp } from "@/components/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthInactivityGuard, AuthSessionProvider } from "@/features/auth"

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <TooltipProvider>
      <AuthSessionProvider>
        {children}
        <AuthInactivityGuard />
        <ToastApp />
      </AuthSessionProvider>
    </TooltipProvider>
  )
}
