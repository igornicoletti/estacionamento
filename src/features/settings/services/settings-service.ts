import {
  type SettingsMfaApp,
  type SettingsProfile,
  type SidebarBehavior,
} from "../types/settings-types"

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

let _profile: SettingsProfile = {
  name: "Igor Nicoletti",
  cpf: "000.000.000-00",
  phone: "(11) 99999-9999",
  email: "igor.nicoletti@redemontecarlo.com",
}

let _mfaApps: SettingsMfaApp[] = [
  {
    id: "mfa-1",
    name: "Aplicativo 636",
    addedAt: "30 de junho de 2026, 12:17:34 (-0300)",
  },
]

let _sidebarBehavior: SidebarBehavior = "expanded"

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function getSettingsProfile(): Promise<SettingsProfile> {
  return Promise.resolve({ ..._profile })
}

export function updateSettingsProfile(
  profile: SettingsProfile
): Promise<SettingsProfile> {
  _profile = { ...profile }
  return Promise.resolve({ ..._profile })
}

// ---------------------------------------------------------------------------
// MFA
// ---------------------------------------------------------------------------

export function listMfaApps(): Promise<SettingsMfaApp[]> {
  return Promise.resolve([..._mfaApps])
}

const MAX_MFA_APP_NAME_LENGTH = 100

function sanitizeMfaAppName(value: string) {
  const trimmed = value.trim().slice(0, MAX_MFA_APP_NAME_LENGTH)

  return trimmed || `Aplicativo ${Math.floor(Math.random() * 900 + 100)}`
}

export function addMfaApp(name: string): Promise<SettingsMfaApp> {
  const app: SettingsMfaApp = {
    id: `mfa-${Date.now()}`,
    name: sanitizeMfaAppName(name),
    addedAt: new Date().toLocaleString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "shortOffset",
    }),
  }

  _mfaApps = [..._mfaApps, app]
  return Promise.resolve(app)
}

export function removeMfaApp(id: string): Promise<void> {
  _mfaApps = _mfaApps.filter((app) => app.id !== id)
  return Promise.resolve()
}

// ---------------------------------------------------------------------------
// Sidebar behavior
// ---------------------------------------------------------------------------

export function getSidebarBehavior(): Promise<SidebarBehavior> {
  return Promise.resolve(_sidebarBehavior)
}

export function updateSidebarBehavior(
  behavior: SidebarBehavior
): Promise<SidebarBehavior> {
  _sidebarBehavior = behavior
  return Promise.resolve(behavior)
}
