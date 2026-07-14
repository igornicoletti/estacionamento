import { ShieldIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { shouldBypassAuthInDev } from "@/config"
import { useAuth } from "@/features/auth"
import type { AuthProfile } from "@/features/auth/api"

import { sidebarCopy } from "./sidebar-copy"

function resolveProfileRoleLabel(profile: AuthProfile | null) {
  if (profile?.role?.label) {
    return profile.role.label
  }

  return shouldBypassAuthInDev()
    ? sidebarCopy.profile.developmentMode
    : sidebarCopy.profile.fallbackRole
}

export function SidebarProfile() {
  const { profile } = useAuth()
  const label = resolveProfileRoleLabel(profile)

  return (
    <SidebarMenu className="px-2 py-3">
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          tabIndex={-1}
          aria-disabled="true"
          className="uppercase font-bold text-primary bg-primary/10 border border-primary hover:bg-primary/20 focus:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 dark:focus:bg-primary/30"
        >
          <ShieldIcon />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
