import { AUTH_STORAGE_KEYS } from "../contracts"

function getStorage(storage: "local" | "session") {
  if (typeof window === "undefined") {
    return null
  }

  return storage === "local" ? window.localStorage : window.sessionStorage
}

export function publishAuthActivity(at = Date.now()) {
  getStorage("local")?.setItem(AUTH_STORAGE_KEYS.activityAt, String(at))
}

export function readPublishedAuthActivity() {
  const value = getStorage("local")?.getItem(AUTH_STORAGE_KEYS.activityAt)
  const timestamp = value ? Number(value) : Number.NaN

  return Number.isFinite(timestamp) ? timestamp : null
}

export function clearPublishedAuthActivity() {
  getStorage("local")?.removeItem(AUTH_STORAGE_KEYS.activityAt)
}

export function readAuthInactivitySessionExpired() {
  return (
    getStorage("session")?.getItem(AUTH_STORAGE_KEYS.inactivityExpired) === "1"
  )
}

export function markAuthInactivitySessionExpired() {
  getStorage("session")?.setItem(AUTH_STORAGE_KEYS.inactivityExpired, "1")
}

export function clearAuthInactivitySessionExpired() {
  getStorage("session")?.removeItem(AUTH_STORAGE_KEYS.inactivityExpired)
}

export function consumeAuthInactivitySessionExpired() {
  const expired = readAuthInactivitySessionExpired()

  if (expired) {
    clearAuthInactivitySessionExpired()
  }

  return expired
}
