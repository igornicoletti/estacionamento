import * as React from "react"
import { Outlet } from "react-router"

interface PublicRouteProps {
  children?: React.ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  return children ?? <Outlet />
}
