import { type UserRecord } from "../model"

const initialUsers: UserRecord[] = []

export interface UsersGateway {
  list(): Promise<UserRecord[]>
  saveAll(users: readonly UserRecord[]): Promise<void>
}

let inMemoryUsers = [...initialUsers]

const inMemoryUsersGateway: UsersGateway = {
  async list() {
    await Promise.resolve()
    return [...inMemoryUsers]
  },
  async saveAll(users) {
    await Promise.resolve()
    inMemoryUsers = [...users]
  },
}

let activeUsersGateway: UsersGateway = inMemoryUsersGateway

export function getUsersGateway() {
  return activeUsersGateway
}

export function setUsersGateway(gateway: UsersGateway) {
  activeUsersGateway = gateway
}

export function resetUsersGateway() {
  activeUsersGateway = inMemoryUsersGateway
}

export function resetUsersInMemoryState() {
  inMemoryUsers = [...initialUsers]
}
