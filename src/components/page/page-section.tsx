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
    <section className={cn("flex flex-col gap-6", className)} {...props}>
      {children}
    </section>
  )
}
