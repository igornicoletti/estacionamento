import * as React from "react"

import {
  completePasskeyLogin,
  completePasskeyRegistration,
  registerPasskey,
  signInWithPasskey,
} from "../services"

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
      await completePasskeyLogin(input)
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
