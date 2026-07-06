import * as React from "react"

interface AuthCardProps {
  title: React.ReactNode
  description: React.ReactNode
  children: React.ReactNode
}

export function AuthCard({ children, description, title }: AuthCardProps) {
  return (
    <section className="mx-auto grid w-full max-w-md gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        {children}
      </div>
    </section>
  )
}
