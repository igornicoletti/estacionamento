import { Link, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"

import { authCopy } from "../auth-copy"
import { AuthCard, AuthRecoveryForm } from "../components"

export function AuthRecoveryRoute() {
  const navigate = useNavigate()

  return (
    <AuthCard
      title={authCopy.recovery.title}
      description={authCopy.recovery.description}
    >
      <AuthRecoveryForm
        onSuccess={() => {
          void navigate("/login", { replace: true })
        }}
      />
      <Button variant="link" asChild className="mt-4 w-full justify-center">
        <Link to="/login">{authCopy.recovery.backToLogin}</Link>
      </Button>
    </AuthCard>
  )
}
