import { ShieldIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { shouldBypassAuthInDev } from "@/config"
import type { AuthProfile } from "@/features/auth/auth-api"
import { useAuth } from "@/features/auth/auth-provider"

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
          aria-disabled="true"
          className="text-primary bg-primary/20 border border-primary/60 uppercase text-xs font-semibold tracking-wider cursor-not-allowed"
        >
          <ShieldIcon />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
