import { Navigate } from "react-router"

import { appRoutePaths } from "../route-registry"

export function ProductionHomeRoute() {
  return <Navigate replace to={appRoutePaths.units} />
}
