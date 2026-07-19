import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { permissionsCopy } from "../constants"

interface PermissionAccessIconProps {
  hasAccess: boolean
}

export function PermissionAccessIcon({ hasAccess }: PermissionAccessIconProps) {
  const Icon = hasAccess ? CheckIcon : XIcon

  return (
    <span className="flex justify-center">
      <Icon
        aria-label={
          hasAccess
            ? permissionsCopy.accessibility.withAccess
            : permissionsCopy.accessibility.withoutAccess
        }
        className={cn(
          "size-4",
          hasAccess ? "text-success" : "text-muted-foreground"
        )}
      />
    </span>
  )
}
