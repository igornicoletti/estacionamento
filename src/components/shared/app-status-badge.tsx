import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn, getBadgeToneClassName, type BadgeTone } from "@/lib"

export interface AppStatusBadgeProps
  extends Omit<React.ComponentProps<typeof Badge>, "variant"> {
  tone?: BadgeTone
}

export function AppStatusBadge({
  tone = "secondary",
  className,
  ...props
}: AppStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      data-tone={tone}
      className={cn(getBadgeToneClassName(tone), className)}
      {...props}
    />
  )
}
