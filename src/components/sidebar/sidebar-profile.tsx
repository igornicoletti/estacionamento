import { ShieldIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { shouldBypassAuthInDev } from "@/config"
import {
  isUserRole,
  userRoleLabels,
} from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"
import { useUsers } from "@/features/users"
import { type UserRecord } from "@/features/users/types/users-types"

type UnknownRecord = Record<PropertyKey, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function getProfileRoleLabel(profile: unknown) {
  if (!isRecord(profile)) {
    return shouldBypassAuthInDev() ? "Desenvolvedor" : "Administrador"
  }

  return isUserRole(profile.role) ? userRoleLabels[profile.role] : "Administrador"
}

function resolveSessionUserRoleLabel(profile: unknown, users: readonly UserRecord[]) {
  if (isRecord(profile) && isUserRole(profile.role)) {
    return userRoleLabels[profile.role]
  }

  if (!users.length) {
    return null
  }

  if (typeof profile === "object" && profile !== null) {
    const profileId = typeof (profile as { id?: unknown }).id === "string"
      ? String((profile as { id: string }).id)
      : null
    const profileEmail = typeof (profile as { email?: unknown }).email === "string"
      ? String((profile as { email: string }).email).toLowerCase()
      : null

    const matchedById = profileId
      ? users.find((user) => user.id === profileId)
      : null

    if (matchedById) {
      return userRoleLabels[matchedById.role]
    }

    const matchedByEmail = profileEmail
      ? users.find((user) => user.email?.toLowerCase() === profileEmail)
      : null

    if (matchedByEmail) {
      return userRoleLabels[matchedByEmail.role]
    }
  }

  const activeUser = users.find((user) => user.status === "active") ?? users[0]

  return activeUser ? userRoleLabels[activeUser.role] : null
}

export function SidebarProfile() {
  const { profile } = useAuthSession()
  const { data: users } = useUsers()
  const label = resolveSessionUserRoleLabel(profile, users) ?? getProfileRoleLabel(profile)

  return (
    <SidebarMenu className="px-4 py-3 group-data-[collapsible=icon]:px-1.5">
      <SidebarMenuItem>
        <SidebarMenuButton
          tabIndex={-1}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold cursor-default uppercase"
        >
          <ShieldIcon className="size-4 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
