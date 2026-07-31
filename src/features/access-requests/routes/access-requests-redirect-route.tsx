import { Navigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"

export function AccessRequestsRedirectRoute() {
  return <Navigate to={`${appRoutePaths.users}?tab=solicitacoes`} replace />
}
