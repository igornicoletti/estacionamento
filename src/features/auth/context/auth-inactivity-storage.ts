import { AUTH_STORAGE_KEYS } from "../contracts"

export function readAuthInactivitySessionExpired() {
  if (typeof window === "undefined") {
    return false
  }

  return window.sessionStorage.getItem(AUTH_STORAGE_KEYS.inactivityExpired) === "1"
}

export function markAuthInactivitySessionExpired() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEYS.inactivityExpired, "1")
}

export function clearAuthInactivitySessionExpired() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.inactivityExpired)
}

export function consumeAuthInactivitySessionExpired() {
  const expired = readAuthInactivitySessionExpired()

  if (expired) {
    clearAuthInactivitySessionExpired()
  }

  return expired
}
