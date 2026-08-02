import "@testing-library/jest-dom/vitest"
import * as React from "react"

import { beforeEach, vi } from "vitest"

import { setAuditGateway } from "@/features/audit/gateways/audit-gateway"
import { setClientsGateway } from "@/features/clients/gateways/clients-gateway"
import {
  setNotificationsGateway,
  type NotificationRecord,
} from "@/features/notifications"
import {
  setPermissionsGateway,
} from "@/features/permissions/gateways/permissions-gateway"
import {
  resetUnitUserStatsGateway,
  setUnitUserStatsGateway,
} from "@/features/units/gateways/unit-user-stats-gateway"
import { type UserRecord } from "@/features/users"
import {
  resetUsersGateway,
  setUsersGateway,
} from "@/features/users/gateways/users-gateway"

import {
  createAuditEventRow,
  createMemoryAuditGateway,
} from "./helpers/audit-memory-gateway"
import { createMemoryClientsGateway } from "./helpers/clients-memory-gateway"
import { createMemoryNotificationsGateway } from "./helpers/notifications-memory-gateway"
import { createMemoryPermissionsGateway } from "./helpers/permissions-memory-gateway"
import { createMemoryUsersGateway } from "./helpers/users-memory-gateway"

if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: {
      value: () => false,
    },
    releasePointerCapture: {
      value: () => undefined,
    },
    setPointerCapture: {
      value: () => undefined,
    },
  })
}

if (!HTMLElement.prototype.scrollIntoView) {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    value: () => undefined,
  })
}

if (!document.elementFromPoint) {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => null,
  })
}

if (!globalThis.ResizeObserver) {
  class TestResizeObserver implements ResizeObserver {
    readonly #callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.#callback = callback
    }

    observe(target: Element) {
      const contentRect = DOMRect.fromRect({
        width: 1024,
        height: 576,
      })

      this.#callback(
        [
          {
            target,
            contentRect,
          } as ResizeObserverEntry,
        ],
        this
      )
    }

    unobserve() { }

    disconnect() { }
  }

  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: TestResizeObserver,
  })
}

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

const { testAuthContext, testAuthSession } = vi.hoisted(() => {
  const profile = {
    authUserId: "test-auth-user",
    avatarPath: null,
    avatarUrl: null,
    cpfMasked: "529.982.247-25",
    email: "admin.test@example.com",
    id: "USR-001",
    name: "Administrador Teste",
    passkeyStatus: "active",
    phoneMasked: "(11) 90000-0001",
    permissions: ["*"],
    role: {
      id: null,
      key: "owner",
      label: "Proprietário",
    },
    roleKey: "owner",
    status: "active",
    unitId: null,
    unitName: null,
  }
  const hasPermission = () => true
  const refresh = vi.fn(() => Promise.resolve(undefined))
  const signOut = vi.fn(() => Promise.resolve(undefined))

  return {
    testAuthContext: {
      access: {
        hasAllPermissions: () => true,
        hasAnyPermission: () => true,
        hasPermission,
        permissions: profile.permissions,
      },
      actions: {
        applyProfilePatch: vi.fn(),
        clearRequiredPasswordChallenge: vi.fn(),
        completeRequiredPassword: vi.fn(() => Promise.resolve({
          flowId: null,
          message: "ok",
          nextAction: "authenticated",
        })),
        logout: vi.fn(),
        logoutAsync: signOut,
        refreshProfile: refresh,
        registerProfilePasskey: vi.fn(() => Promise.resolve({
          createdAt: null,
          friendlyName: null,
          id: "test-passkey",
        })),
        signInWithPasskey: vi.fn(() => Promise.resolve(undefined)),
        signInWithPassword: vi.fn(() => Promise.resolve({
          flowId: null,
          message: "ok",
          nextAction: "authenticated",
        })),
      },
      error: null,
      inactivity: {
        consumeExpired: () => false,
        continueSession: vi.fn(),
        isWarningOpen: false,
        markExpired: vi.fn(),
        secondsRemaining: 0,
      },
      isAuthenticated: true,
      isLoading: false,
      isSubmitting: false,
      passwordChange: {
        required: false,
      },
      profile,
      status: "authenticated",
    },
    testAuthSession: {
      isAuthenticated: true,
      isLoading: false,
      profile,
      refresh,
      signOut,
    },
  }
})

const seedUsers: UserRecord[] = [
  {
    authUserId: "03eb9a74-9507-41b6-9965-b5e106eb8d49",
    cpf: "111.444.777-35",
    email: "usuario.teste@example.com",
    id: "USR-001",
    lastAccessAt: "2026-07-01 08:25",
    name: "Usuario Teste",
    passkeyStatus: "active",
    phoneMasked: "(11) 98888-7777",
    role: "manager",
    status: "active",
    unitId: "1",
    unitName: "Monte Carlo Centro",
  },
  {
    authUserId: "4da46b34-0d68-40b8-92f1-da26a139bd43",
    cpf: "935.411.347-80",
    email: "operador.teste@example.com",
    id: "USR-002",
    lastAccessAt: null,
    name: "Operador Teste",
    passkeyStatus: "inactive",
    phoneMasked: "(11) 97777-6666",
    role: "operator",
    status: "active",
    unitId: "1",
    unitName: "Monte Carlo Centro",
  },
]

const seedNotifications: NotificationRecord[] = [
  {
    description: "Clientes e unidades foram sincronizados com sucesso.",
    href: "/clientes",
    id: "N-001",
    occurredAt: "2026-07-01T08:25:00.000Z",
    status: "unread",
    title: "Sincronização concluída",
    type: "sync",
  },
  {
    description: "Uma nova tentativa de login foi registrada para seu usuário.",
    href: "/meu-perfil",
    id: "N-002",
    occurredAt: "2026-07-01T07:58:00.000Z",
    status: "unread",
    title: "Nova tentativa de acesso",
    type: "security",
  },
  {
    description: "Nova versão do painel foi publicada com melhorias de desempenho.",
    id: "N-003",
    occurredAt: "2026-06-30T19:10:00.000Z",
    status: "read",
    title: "Atualização aplicada",
    type: "system",
  },
]

const seedAuditEvents = [createAuditEventRow()]

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>()

  return {
    ...actual,
    useAuth: () => testAuthContext,
    useAuthSession: () => testAuthSession,
  }
})

vi.mock("@/features/auth/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/context")>()

  return {
    ...actual,
    useAuth: () => testAuthContext,
    useAuthSession: () => testAuthSession,
  }
})

vi.mock("@/components/ui/tooltip", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui/tooltip")>()

  function passthrough({ children }: { children?: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children)
  }

  return {
    ...actual,
    Tooltip: passthrough,
    TooltipContent: passthrough,
    TooltipProvider: passthrough,
    TooltipTrigger: passthrough,
  }
})

beforeEach(() => {
  setClientsGateway(createMemoryClientsGateway())
  setAuditGateway(createMemoryAuditGateway(seedAuditEvents))
  setPermissionsGateway(createMemoryPermissionsGateway())
  setNotificationsGateway(createMemoryNotificationsGateway(seedNotifications))

  resetUsersGateway()
  const usersGateway = createMemoryUsersGateway(seedUsers)
  setUsersGateway(usersGateway)

  resetUnitUserStatsGateway()
  setUnitUserStatsGateway({
    async listStats() {
      await Promise.resolve()
      const stats = new Map<string, { managers: number; operators: number }>()
      for (const user of await usersGateway.list()) {
        if (!user.unitId || user.status !== "active") {
          continue
        }
        const current = stats.get(user.unitId) ?? { managers: 0, operators: 0 }
        if (user.role === "manager") {
          current.managers += 1
        }
        if (user.role === "operator") {
          current.operators += 1
        }
        stats.set(user.unitId, current)
      }
      return Array.from(stats, ([unitId, values]) => ({
        managers: values.managers,
        operators: values.operators,
        unit_id: Number(unitId),
      }))
    },
  })
})
