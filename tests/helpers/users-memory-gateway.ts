import { formatCpf, formatPhone } from "@/lib"
import {
  type CreateUserCommand,
  type UpdateUserCommand,
  type UserMutationResult,
  type UsersGateway,
} from "@/features/users/services/users-gateway"
import { type UserRecord } from "@/features/users/model"

function cloneUsers(users: readonly UserRecord[]) {
  return users.map((user) => ({ ...user }))
}

export function createMemoryUsersGateway(
  initialUsers: readonly UserRecord[] = []
): UsersGateway {
  let users = cloneUsers(initialUsers)

  function getByAuthUserId(authUserId: string) {
    const user = users.find((item) => item.authUserId === authUserId)

    if (!user) {
      throw new Error("Usuário não encontrado.")
    }

    return user
  }

  function result(user: UserRecord): UserMutationResult {
    return {
      authUserId: user.authUserId ?? "",
      id: user.id,
    }
  }

  function replace(user: UserRecord) {
    users = users.map((item) => (item.id === user.id ? user : item))
    return result(user)
  }

  function patch(
    authUserId: string,
    values: Partial<UserRecord>
  ): UserMutationResult {
    const current = getByAuthUserId(authUserId)

    return replace({ ...current, ...values })
  }

  return {
    block(authUserId) {
      return Promise.resolve(
        patch(authUserId, { lockedUntil: null, status: "inactive" })
      )
    },
    clearLock(authUserId) {
      return Promise.resolve(
        patch(authUserId, { lockedUntil: null, status: "active" })
      )
    },
    create(command: CreateUserCommand) {
      const id = `USR-${String(users.length + 1).padStart(3, "0")}`
      const authUserId = `auth-${id}`
      const user: UserRecord = {
        authUserId,
        cpf: formatCpf(command.cpf),
        email: command.email,
        id,
        lastAccessAt: null,
        lockedUntil: null,
        name: command.name,
        passkeyCount: 0,
        passkeyStatus: "inactive",
        phoneMasked: formatPhone(command.phone),
        role: command.role,
        status: "pending",
        unitId: command.unitId,
        unitName: null,
      }

      users = [user, ...users]
      return Promise.resolve(result(user))
    },
    list() {
      return Promise.resolve(cloneUsers(users))
    },
    resetPasskey(authUserId) {
      return Promise.resolve(
        patch(authUserId, {
          passkeyCount: 0,
          passkeyStatus: "inactive",
          status: "passkey_reset",
        })
      )
    },
    resetPassword(authUserId) {
      return Promise.resolve(
        patch(authUserId, { lockedUntil: null, status: "password_reset" })
      )
    },
    revokeSessions(authUserId) {
      return Promise.resolve(result(getByAuthUserId(authUserId)))
    },
    update(command: UpdateUserCommand) {
      return Promise.resolve(
        patch(command.targetAuthUserId, {
          cpf: formatCpf(command.cpf),
          email: command.email,
          name: command.name,
          phoneMasked: formatPhone(command.phone),
          role: command.role,
          unitId: command.unitId,
          unitName: null,
        })
      )
    },
  }
}
