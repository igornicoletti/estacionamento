import * as React from "react"

import { type AuthFlowStep } from "../types"

export function useAuthFlow() {
  const [flowId, setFlowId] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<AuthFlowStep>("credentials")

  const reset = React.useCallback(() => {
    setFlowId(null)
    setStep("credentials")
  }, [])

  return {
    flowId,
    reset,
    setFlowId,
    setStep,
    step,
  }
}
