import { ShieldIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { shouldBypassAuthInDev } from "@/config"
import { useAuth, type AuthProfile } from "@/features/auth"

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
          variant="outline"
          tooltip={label}
          aria-label={label}
          className="cursor-default border-sidebar-primary-foreground/20 bg-sidebar-primary-foreground/10 text-[0.6875rem] font-semibold uppercase tracking-wider text-sidebar-primary-foreground hover:bg-sidebar-primary-foreground/10 hover:text-sidebar-primary-foreground active:bg-sidebar-primary-foreground/10 active:text-sidebar-primary-foreground"
        >
          <ShieldIcon className="size-4" />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
