import "@testing-library/jest-dom/vitest"
import * as React from "react"

import { beforeEach, vi } from "vitest"

import {
  createMemoryNotificationsGateway,
  setNotificationsGateway,
  type NotificationRecord,
} from "@/features/notifications"
import {
  createMemoryVipRulesGateway,
  setVipRulesGateway,
} from "@/features/rules"
import {
  resetUsersGateway,
  setUsersGateway,
  type UserRecord,
} from "@/features/users"

const testAuthSession = {
  isAuthenticated: true,
  isLoading: false,
  profile: {
    authUserId: "test-auth-user",
    avatarUrl: null,
    cpfMasked: "***.***.***-25",
    email: "igor.nicoletti@redemontecarlo.com",
    id: "USR-001",
    name: "Igor Nicoletti",
    passkeyStatus: "active",
    phoneMasked: "(17) 99130-4197",
    role: "owner",
    status: "active",
    unitId: null,
    unitName: null,
  },
  refresh: vi.fn(async () => { }),
  signOut: vi.fn(async () => { }),
}

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

vi.mock("@/features/auth/context/auth-session-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/context/auth-session-context")>()

  return {
    ...actual,
    useAuthSession: () => testAuthSession,
  }
})

vi.mock("@/features/auth/hooks", () => {
  return {
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
  setVipRulesGateway(createMemoryVipRulesGateway())

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
