import type { ComponentType } from "react"

import { accessRequestsCopy } from "@/features/access-requests/access-requests-copy"
import { routeCapabilities, type AuthCapability } from "@/features/auth"

export interface RouteModuleDefinition {
  id: string
  load: () => Promise<{ default: ComponentType }>
  path: string
  requiredCapabilities: readonly AuthCapability[]
}

export interface SearchableRouteDefinition extends RouteModuleDefinition {
  defaultPriority: number
  description: string
  href: `/${string}`
  label: string
}

export interface AuthRouteDefinition {
  id: string
  load: () => Promise<{ default: ComponentType }>
  path: string
}

export const authRouteDefinitions = [
  {
    id: "login",
    path: "login",
    load: () =>
      import("@/features/auth/routes/auth-login-route").then((module) => ({
        default: module.AuthLoginRoute,
      })),
  },
  {
    id: "access-recovery",
    path: "recuperar-acesso",
    load: () =>
      import("@/features/auth/routes/auth-recovery-route").then((module) => ({
        default: module.AuthRecoveryRoute,
      })),
  },
] as const satisfies readonly AuthRouteDefinition[]

export const appRouteDefinitions = [
  {
    id: "units",
    path: "unidades",
    href: "/unidades",
    label: "Unidades",
    description: "Acompanhar unidades sincronizadas do ERP.",
    defaultPriority: 10,
    requiredCapabilities: routeCapabilities.units,
    load: () =>
      import("@/features/units").then((module) => ({
        default: module.UnitsRoute,
      })),
  },
  {
    id: "clients",
    path: "clientes",
    href: "/clientes",
    label: "Clientes",
    description: "Acompanhar clientes sincronizados do ERP.",
    defaultPriority: 20,
    requiredCapabilities: routeCapabilities.clients,
    load: () =>
      import("@/features/clients").then((module) => ({
        default: module.ClientsRoute,
      })),
  },
  {
    id: "users",
    path: "usuarios",
    href: "/usuarios",
    label: "Usuários",
    description: "Gerenciar usuários e acessos ao sistema.",
    defaultPriority: 30,
    requiredCapabilities: routeCapabilities.users,
    load: () =>
      import("@/features/users").then((module) => ({
        default: module.UsersRoute,
      })),
  },
] as const satisfies readonly SearchableRouteDefinition[]

export const appSecurityRouteDefinitions = [
  {
    id: "accessRequests",
    path: "solicitacoes-acesso",
    href: "/solicitacoes-acesso",
    label: accessRequestsCopy.page.title,
    description: accessRequestsCopy.page.subtitle,
    defaultPriority: 40,
    requiredCapabilities: routeCapabilities.accessRequests,
    load: () =>
      import("@/features/access-requests").then((module) => ({
        default: module.AccessRequestsRoute,
      })),
  },
  {
    id: "audit",
    path: "auditoria",
    href: "/auditoria",
    label: "Auditoria",
    description: "Acompanhar eventos de segurança e ações do sistema.",
    defaultPriority: 50,
    requiredCapabilities: routeCapabilities.audit,
    load: () =>
      import("@/features/audit").then((module) => ({
        default: module.AuditRoute,
      })),
  },
  {
    id: "permissions",
    path: "perfis-permissoes",
    href: "/perfis-permissoes",
    label: "Perfil e Permissões",
    description: "Consultar a matriz de perfis e acessos do sistema.",
    defaultPriority: 60,
    requiredCapabilities: routeCapabilities.permissions,
    load: () =>
      import("@/features/permissions").then((module) => ({
        default: module.PermissionsRoute,
      })),
  },
] as const satisfies readonly SearchableRouteDefinition[]

export const appCommercialRouteDefinitions = [
  {
    id: "prices",
    path: "precos",
    href: "/precos",
    label: "Preços",
    description: "Gerenciar tabelas e políticas de preços.",
    defaultPriority: 70,
    requiredCapabilities: routeCapabilities.prices,
    load: () =>
      import("@/features/prices").then((module) => ({
        default: module.PricesRoute,
      })),
  },
  {
    id: "rules",
    path: "regras",
    href: "/regras",
    label: "Regras",
    description: "Gerenciar regras VIP e critérios comerciais.",
    defaultPriority: 80,
    requiredCapabilities: routeCapabilities.rules,
    load: () =>
      import("@/features/rules").then((module) => ({
        default: module.RulesRoute,
      })),
  },
] as const satisfies readonly SearchableRouteDefinition[]

export const appUtilityRouteDefinitions = [
  {
    id: "notifications",
    path: "notificacoes",
    href: "/notificacoes",
    label: "Notificações",
    description: "Acompanhar notificações e alertas recentes.",
    defaultPriority: 90,
    requiredCapabilities: routeCapabilities.notifications,
    load: () =>
      import("@/features/notifications").then((module) => ({
        default: module.NotificationsRoute,
      })),
  },
  {
    id: "settings",
    path: "configuracoes",
    href: "/configuracoes",
    label: "Meu perfil",
    description: "Gerenciar perfil, segurança e preferências da conta.",
    defaultPriority: 100,
    requiredCapabilities: routeCapabilities.settings,
    load: () =>
      import("@/features/settings").then((module) => ({
        default: module.SettingsRoute,
      })),
  },
] as const satisfies readonly SearchableRouteDefinition[]

export const searchableRouteDefinitions = [
  ...appRouteDefinitions,
  ...appSecurityRouteDefinitions,
  ...appCommercialRouteDefinitions,
  ...appUtilityRouteDefinitions,
] as const satisfies readonly SearchableRouteDefinition[]

export const appDynamicRouteDefinitions = [
  {
    id: "client-vehicles",
    path: "clientes/:cod_pessoa",
    requiredCapabilities: routeCapabilities.clientVehicles,
    load: () =>
      import("@/features/clients").then((module) => ({
        default: module.ClientVehiclesRoute,
      })),
  },
  {
    id: "unit-users",
    path: "unidades/:cod_empresa/usuarios",
    requiredCapabilities: [
      ...routeCapabilities.units,
      ...routeCapabilities.users,
    ],
    load: () =>
      import("@/features/units").then((module) => ({
        default: module.UnitUsersRoute,
      })),
  },
  {
    id: "settings-profile-alias",
    path: "perfil",
    requiredCapabilities: routeCapabilities.settings,
    load: () =>
      import("@/features/settings").then((module) => ({
        default: module.SettingsRoute,
      })),
  },
] as const satisfies readonly RouteModuleDefinition[]

export const protectedRouteDefinitions = [
  ...searchableRouteDefinitions,
  ...appDynamicRouteDefinitions,
] as const satisfies readonly RouteModuleDefinition[]
