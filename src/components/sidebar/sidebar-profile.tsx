import { ShieldIcon } from "lucide-react"

import { shouldBypassAuthInDev } from "@/config"
import {
  isUserRole,
  userRoleLabels,
} from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"

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

export function SidebarProfile() {
  const { profile } = useAuthSession()
  const label = getProfileRoleLabel(profile)

  return (
    <div className="px-3 py-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
        <ShieldIcon className="size-4 shrink-0 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary truncate group-data-[collapsible=icon]:hidden">
          {label}
        </span>
      </div>
    </div>
  )
}
