import type { ReactNode } from "react"

import { ToastApp } from "@/components/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth"

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        {children}
        <ToastApp />
      </AuthProvider>
    </TooltipProvider>
  )
}
