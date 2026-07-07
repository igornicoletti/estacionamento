import * as React from "react"

import { ToastApp } from "@/components/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthInactivityGuard, AuthSessionProvider } from "@/features/auth"

export function AppProviders({ children }: { children: React.ReactNode }) {
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
