import { Outlet } from "react-router"

export function AuthShell() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background">
      <Outlet />
    </main>
  )
}
