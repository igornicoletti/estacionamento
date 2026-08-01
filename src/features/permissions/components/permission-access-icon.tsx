import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { permissionsCopy } from "../constants/permissions-copy"

interface PermissionAccessIconProps {
  hasAccess: boolean
}

export function PermissionAccessIcon({ hasAccess }: PermissionAccessIconProps) {
  const Icon = hasAccess ? CheckIcon : XIcon

  return (
    <span
      aria-label={
        hasAccess
          ? permissionsCopy.accessibility.withAccess
          : permissionsCopy.accessibility.withoutAccess
      }
      className="flex justify-center"
      role="img"
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4",
          hasAccess ? "text-success" : "text-muted-foreground"
        )}
        data-icon="status"
      />
    </span>
  )
}
