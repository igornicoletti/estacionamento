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
      <CardHeader className="text-center">
        <img
          src={montecarloLogo}
          alt="Rede Monte Carlo"
          className="mx-auto h-auto w-full max-w-xs object-contain"
        />
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
