import * as React from "react"

import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AuthPageCardProps {
  title: React.ReactNode
  description: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AuthPageCard({
  title,
  description,
  children,
  className,
}: AuthPageCardProps) {
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="space-y-1">
        <img
          src={montecarloLogo}
          alt="Monte Carlo Logo"
          className="h-8 w-auto"
        />
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">{children}</CardContent>
    </Card>
  )
}
