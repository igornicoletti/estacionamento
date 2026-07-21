import * as React from "react"

import { notify } from "@/components/toast"
import { useAuth } from "@/features/auth"

import { securityCopy } from "../constants/security-copy"
import { changeCurrentPassword } from "../services/security-password-service"

export function useSecurityPasswordChange() {
  const auth = useAuth()
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const activeChangeRef = React.useRef<Promise<void> | null>(null)

  const changePassword = React.useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      if (activeChangeRef.current) {
        return activeChangeRef.current
      }

      setIsChangingPassword(true)

      const changePromise = (async () => {
        await notify.track(
          changeCurrentPassword(input),
          securityCopy.feedback.password
        )
        await auth.actions.logoutAsync()
      })()

      activeChangeRef.current = changePromise

      try {
        await changePromise
      } finally {
        activeChangeRef.current = null
        setIsChangingPassword(false)
      }
    },
    [auth.actions]
  )

  return {
    changePassword,
    isChangingPassword,
  }
}
