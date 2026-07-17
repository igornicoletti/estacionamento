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
    <SidebarMenu className="px-2 py-2">
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          className="text-[0.6875rem] uppercase font-semibold tracking-wider text-sidebar-primary-foreground hover:text-sidebar-primary-foreground border border-sidebar-primary-foreground/20 bg-sidebar-primary-foreground/10 hover:bg-sidebar-primary-foreground/10 focus:bg-sidebar-primary-foreground/10"
        >
          <ShieldIcon className="size-4" />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
