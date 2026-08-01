import { describe, expect, it, vi } from "vitest"

import { createUserRowActions } from "@/features/users/table/users-row-actions"
import type { UserRecord } from "@/features/users"

const user: UserRecord = {
  authUserId: "auth-target-user",
  cpf: "529.982.247-25",
  email: "target@example.com",
  id: "USR-001",
  lastAccessAt: null,
  lockedUntil: null,
  name: "Target User",
  passkeyCount: 1,
  passkeyStatus: "active",
  phoneMasked: "(11) 98888-7777",
  role: "operator",
  status: "active",
  unitId: "2",
  unitName: "Monte Carlo Norte",
}

describe("users row actions", () => {
  it("exposes only details when the target cannot be managed", () => {
    const actions = createUserRowActions(user, {
      canManageUser: () => false,
      onBlockUser: vi.fn(),
      onEditUser: vi.fn(),
      onResetAccess: vi.fn(),
      onResetPasskey: vi.fn(),
      onRevokeSessions: vi.fn(),
      onViewUserDetails: vi.fn(),
    })

    expect(actions.map((action) => action.id)).toEqual(["details"])
  })

  it("exposes valid administrative actions for an active passkey user", () => {
    const actions = createUserRowActions(user, {
      canManageUser: () => true,
      onBlockUser: vi.fn(),
      onClearLock: vi.fn(),
      onEditUser: vi.fn(),
      onResetAccess: vi.fn(),
      onResetPasskey: vi.fn(),
      onRevokeSessions: vi.fn(),
      onViewUserDetails: vi.fn(),
    })

    expect(actions.map((action) => action.id)).toEqual([
      "details",
      "edit",
      "reset-access",
      "reset-passkey",
      "revoke-sessions",
      "block",
    ])
  })
})
