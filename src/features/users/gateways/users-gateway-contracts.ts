import {
  type UserRecord,
  type UserRole,
} from "../model/users-types"

export interface CreateUserCommand {
  cpf: string
  email: string | null
  name: string
  phone: string
  role: UserRole
  temporaryPassword: string
  unitId: string | null
}

export interface UpdateUserCommand {
  cpf: string
  email: string | null
  name: string
  phone: string
  role: UserRole
  targetAuthUserId: string
  unitId: string | null
}

export interface UserIdentity {
  authUserId: string
  id: string
}

export type UserMutationResult = UserIdentity

export interface UsersGateway {
  block(targetAuthUserId: string): Promise<UserMutationResult>
  clearLock(targetAuthUserId: string): Promise<UserMutationResult>
  create(command: CreateUserCommand): Promise<UserMutationResult>
  findIdentity(userId: string): Promise<UserIdentity | null>
  list(): Promise<UserRecord[]>
  resetPasskey(targetAuthUserId: string): Promise<UserMutationResult>
  resetPassword(targetAuthUserId: string): Promise<UserMutationResult>
  revokeSessions(targetAuthUserId: string): Promise<UserMutationResult>
  update(command: UpdateUserCommand): Promise<UserMutationResult>
}
