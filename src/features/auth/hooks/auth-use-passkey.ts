import * as React from "react"

import {
  registerPasskey,
  signInWithPasskey,
} from "../services"

export function usePasskey() {
  const [isPending, setIsPending] = React.useState(false)

  const authenticate = React.useCallback(async () => {
    setIsPending(true)

    try {
      await signInWithPasskey()
    } finally {
      setIsPending(false)
    }
  }, [])

  const createPasskey = React.useCallback(async () => {
    setIsPending(true)

    try {
      await registerPasskey()
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
