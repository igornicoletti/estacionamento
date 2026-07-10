import type { ReactNode } from "react"

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
  title: ReactNode
  description: ReactNode
  children: ReactNode
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
      <CardHeader className="space-y-1 text-center">
        <img
          src={montecarloLogo}
          alt="Rede Monte Carlo"
          className="mx-auto h-16 w-auto"
        />
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
