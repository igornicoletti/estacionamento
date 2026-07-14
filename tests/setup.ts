import "@testing-library/jest-dom/vitest"
import * as React from "react"

import { beforeEach, vi } from "vitest"

import {
  createMemoryNotificationsGateway,
  setNotificationsGateway,
  type NotificationRecord,
} from "@/features/notifications"
import {
  resetUsersGateway,
  setUsersGateway,
  type UserRecord,
} from "@/features/users"

const { testAuthContext, testAuthSession } = vi.hoisted(() => {
  const profile = {
    authUserId: "test-auth-user",
    avatarUrl: null,
    cpfMasked: "***.***.***-25",
    email: "igor.nicoletti@redemontecarlo.com",
    id: "USR-001",
    name: "Igor Nicoletti",
    passkeyStatus: "active",
    phoneMasked: "(17) 99130-4197",
    permissions: ["*"],
    role: "owner",
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
        clearRequiredPasswordChallenge: vi.fn(),
        completeRequiredPassword: vi.fn(() => Promise.resolve({
          flowId: null,
          message: "ok",
          nextAction: "authenticated",
          profile: null,
        })),
        logout: vi.fn(),
        logoutAsync: signOut,
        refreshProfile: refresh,
        registerRequiredPasskey: vi.fn(() => Promise.resolve({
          flowId: null,
          message: "ok",
          nextAction: "authenticated",
          profile: null,
        })),
        signInWithPasskey: vi.fn(() => Promise.resolve(undefined)),
        signInWithPassword: vi.fn(() => Promise.resolve({
          flowId: null,
          message: "ok",
          nextAction: "authenticated",
          profile: null,
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
    cpf: "529.982.247-25",
    email: "ana.pereira@redemontecarlo.com",
    id: "USR-001",
    lastAccessAt: "2026-07-01 08:25",
    name: "Ana Pereira",
    passkeyStatus: "active",
    phoneMasked: "(11) 98888-7777",
    role: "manager",
    status: "active",
    unitId: "1",
    unitName: "Monte Carlo Centro",
  },
  {
    authUserId: "03eb9a74-9507-41b6-9965-b5e106eb8d49",
    cpf: "111.444.777-35",
    email: "carlos.lima@redemontecarlo.com",
    id: "USR-002",
    lastAccessAt: null,
    name: "Carlos Lima",
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
    href: "/perfil",
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

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>()

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
  setNotificationsGateway(createMemoryNotificationsGateway(seedNotifications))

  const currentUsers = seedUsers.map((user) => ({ ...user }))

  resetUsersGateway()
  setUsersGateway({
    async list() {
      await Promise.resolve()
      return [...currentUsers]
    },
    async saveAll(users) {
      await Promise.resolve()
      currentUsers.splice(0, currentUsers.length, ...users)
    },
  })
})
