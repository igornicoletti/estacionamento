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
      <CardHeader className="space-y-4 text-center">
        <img
          src={montecarloLogo}
          alt="Rede Monte Carlo"
          className="mx-auto h-auto w-full max-w-sm object-contain"
        />
        <div className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  )
}
