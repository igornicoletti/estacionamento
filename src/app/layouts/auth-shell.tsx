import { Outlet } from "react-router"

export function AuthShell() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <Outlet />
    </main>
  )
}
