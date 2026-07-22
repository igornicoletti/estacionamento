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
    <div className="grid w-full max-w-md gap-6">
      <img
        src={montecarloLogo}
        alt="Rede Monte Carlo"
        className="mx-auto h-auto w-full max-w-xs object-contain"
      />
      <Card className={cn("w-full", className)}>
        <CardHeader className="text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
