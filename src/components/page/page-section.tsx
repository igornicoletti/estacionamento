import * as React from "react"

import { cn } from "@/lib"

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function PageSection({
  children,
  className,
  ...props
}: PageSectionProps) {
  return (
    <section className={cn("flex min-h-0 flex-1 flex-col gap-4", className)} {...props}>
      {children}
    </section>
  )
}
