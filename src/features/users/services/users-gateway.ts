import { type UserRecord } from "../types/users-types"

const initialUsers: UserRecord[] = [
  {
    id: "USR-001",
    name: "Ana Pereira",
    cpf: "123.456.789-01",
    email: "ana.pereira@rmc.local",
    phoneMasked: "(11) 99999-8888",
    role: "admin",
    status: "active",
    unitId: null,
    unitName: null,
    mfaStatus: "active",
    lastAccessAt: "2026-06-30 15:32",
  },
  {
    id: "USR-002",
    name: "Bruno Martins",
    cpf: "987.654.321-00",
    email: "bruno.martins@rmc.local",
    phoneMasked: "(21) 98888-7777",
    role: "auditor",
    status: "active",
    unitId: null,
    unitName: null,
    mfaStatus: "inactive",
    lastAccessAt: "2026-06-29 10:11",
  },
  {
    id: "USR-003",
    name: "Carlos Oliveira",
    cpf: "312.654.987-11",
    email: "carlos.oliveira@rmc.local",
    phoneMasked: "(11) 97777-6666",
    role: "manager",
    status: "active",
    unitId: "1",
    unitName: "Monte Carlo Centro",
    mfaStatus: "active",
    lastAccessAt: "2026-06-28 08:44",
  },
  {
    id: "USR-004",
    name: "Daniela Souza",
    cpf: "741.852.963-00",
    email: "daniela.souza@rmc.local",
    phoneMasked: "(11) 96666-5555",
    role: "operator",
    status: "active",
    unitId: "1",
    unitName: "Monte Carlo Centro",
    mfaStatus: "inactive",
    lastAccessAt: "2026-06-27 19:10",
  },
]

export interface UsersGateway {
  list(): Promise<UserRecord[]>
  saveAll(users: UserRecord[]): Promise<void>
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
