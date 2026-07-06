import * as React from "react"

import {
  routeCapabilities,
  type AuthCapability,
  type AuthorizedRouteId,
} from "@/features/auth"

export interface SearchableRouteDefinition {
  id: string
  href: `/${string}`
  label: string
  description: string
  requiredCapabilities?: readonly AuthCapability[]
}

export interface AppRouteDefinition extends SearchableRouteDefinition {
  id: Exclude<AuthorizedRouteId, "clientVehicles">
  path: string
  requiredCapabilities: readonly AuthCapability[]
  load: () => Promise<{ default: React.ComponentType }>
}

export const appRouteDefinitions = [
  {
    id: "units",
    path: "unidades",
    href: "/unidades",
    label: "Unidades",
    description: "Acompanhar unidades sincronizadas do ERP.",
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
    requiredCapabilities: routeCapabilities.users,
    load: () =>
      import("@/features/users").then((module) => ({
        default: module.UsersRoute,
      })),
  },
] as const satisfies readonly AppRouteDefinition[]

export const appSecurityRouteDefinitions = [
  {
    id: "audit",
    path: "auditoria",
    href: "/auditoria",
    label: "Auditoria",
    description: "Acompanhar eventos de segurança e ações do sistema.",
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
    requiredCapabilities: routeCapabilities.permissions,
    load: () =>
      import("@/features/permissions").then((module) => ({
        default: module.PermissionsRoute,
      })),
  },
] as const satisfies readonly AppRouteDefinition[]

export const appCommercialRouteDefinitions = [
  {
    id: "prices",
    path: "precos",
    href: "/precos",
    label: "Preços",
    description: "Gerenciar tabelas e políticas de preços.",
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
    requiredCapabilities: routeCapabilities.rules,
    load: () =>
      import("@/features/rules").then((module) => ({
        default: module.RulesRoute,
      })),
  },
] as const satisfies readonly AppRouteDefinition[]

/**
 * All lazily-loaded, capability-protected page routes that are wired into the
 * router by a single generic mapping.
 */
export const lazyAppRouteDefinitions = [
  ...appRouteDefinitions,
  ...appSecurityRouteDefinitions,
  ...appCommercialRouteDefinitions,
] as const satisfies readonly AppRouteDefinition[]

export const appUtilityRouteDefinitions =
  [
    {
      id: "notifications",
      href: "/notificacoes",
      label: "Notificações",
      description: "Acompanhar notificações e alertas recentes.",
      requiredCapabilities: routeCapabilities.notifications,
    },
    {
      id: "settings",
      href: "/configuracoes",
      label: "Meu perfil",
      description: "Gerenciar perfil, segurança e preferências da conta.",
      requiredCapabilities: routeCapabilities.settings,
    },
  ] as const satisfies readonly SearchableRouteDefinition[]

export const searchableRouteDefinitions = [
  ...appRouteDefinitions,
  ...appSecurityRouteDefinitions,
  ...appCommercialRouteDefinitions,
  ...appUtilityRouteDefinitions,
] as const satisfies readonly SearchableRouteDefinition[]
