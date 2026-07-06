import { Link } from "react-router"

import { Button } from "@/components/ui/button"

import { authCopy } from "../auth-copy"
import { AuthCard, AuthRecoveryForm } from "../components"

export function AuthRecoveryRoute() {
  return (
    <AuthCard
      title={authCopy.recovery.title}
      description={authCopy.recovery.description}
    >
      <div className="grid gap-4">
        <AuthRecoveryForm />
        <Button variant="link" asChild className="justify-center">
          <Link to="/login">{authCopy.recovery.backToLogin}</Link>
        </Button>
      </div>
    </AuthCard>
  )
}
