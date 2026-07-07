import * as React from "react"

import {
  completePasskeyLogin,
  completePasskeyRegistration,
} from "../services/auth-api"
import {
  registerPasskey,
  signInWithPasskey,
} from "../services/auth-passkey-client"
import { signOutCurrentSession } from "../services/auth-session"

interface PasskeyFlowInput {
  cpf: string
  flowId: string
}

export function usePasskey() {
  const [isPending, setIsPending] = React.useState(false)

  const authenticate = React.useCallback(async (input: PasskeyFlowInput) => {
    setIsPending(true)

    try {
      await signInWithPasskey()

      try {
        await completePasskeyLogin(input)
      } catch (caughtError) {
        // The WebAuthn ceremony already succeeded and persisted a real
        // Supabase session at this point. If our own app-level bookkeeping
        // rejects it (e.g. account not "active" yet), sign the stale
        // session out so it doesn't linger in storage after a blocked login.
        await signOutCurrentSession()
        throw caughtError
      }
    } finally {
      setIsPending(false)
    }
  }, [])

  const createPasskey = React.useCallback(async (input: PasskeyFlowInput) => {
    setIsPending(true)

    try {
      await registerPasskey()
      await completePasskeyRegistration(input)
    } finally {
      setIsPending(false)
    }
  }, [])

  return {
    authenticate,
    createPasskey,
    isPending,
  }
}
