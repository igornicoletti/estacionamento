import * as React from "react"

import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthCard({ children, description, title }: AuthCardProps) {
  return (
    <section className="mx-auto grid w-full max-w-md gap-6">
      <div className="grid gap-2 text-center">
        <img
          src={montecarloLogo}
          alt="Rede Monte Carlo"
          className="mx-auto h-20 w-auto"
        />
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-6 grid gap-1 text-center">
          <h1 className="text-lg font-semibold tracking-normal">{title}</h1>
          <p className="text-sm text-balance text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </section>
  )
}
