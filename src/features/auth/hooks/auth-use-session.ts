import { useAuthSessionContext } from "../context/auth-session-context"

export function useAuthSession() {
  return useAuthSessionContext()
}
