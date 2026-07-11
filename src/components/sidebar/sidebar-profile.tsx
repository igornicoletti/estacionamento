import { ShieldIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { shouldBypassAuthInDev } from "@/config"
import type { AuthProfile } from "@/features/auth/api"
import { useAuth } from "@/features/auth"

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
          className="cursor-default text-primary hover:bg-transparent hover:text-primary active:bg-transparent active:text-primary"
        >
          <ShieldIcon />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
