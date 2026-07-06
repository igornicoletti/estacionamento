export interface SettingsProfile {
  name: string
  cpf: string
  phone: string
  email: string
}

export interface SettingsMfaApp {
  id: string
  name: string
  addedAt: string
}

export type SidebarBehavior = "expanded" | "collapsed" | "hover"

export const sidebarBehaviorLabels: Record<SidebarBehavior, string> = {
  collapsed: "Recolhido",
  expanded: "Expandido",
  hover: "Expandir ao passar o mouse",
}

export const sidebarBehaviorValues: readonly SidebarBehavior[] = [
  "expanded",
  "collapsed",
  "hover",
]
