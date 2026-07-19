import { Navigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"

export function ProfileLegacyRedirectRoute() {
  return <Navigate to={appRoutePaths.profile} replace />
}

export default ProfileLegacyRedirectRoute
