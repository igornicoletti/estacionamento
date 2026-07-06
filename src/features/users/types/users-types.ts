import { type AppUserStatus, type UserRole } from "@/features/auth"

export interface UserRecord {
  id: string
  name: string
  cpf: string
  email: string | null
  phoneMasked: string | null
  role: UserRole
  status: AppUserStatus
  unitId: string | null
  unitName: string | null
  mfaStatus: "active" | "inactive"
  lastAccessAt: string | null
}

export interface CreateUserInput {
  name: string
  cpf: string
  email?: string
  phone?: string
  role: UserRole
  unitId?: string
  unitName?: string
  firstAccessPassword: string
}

export interface UpdateUserInput extends Omit<CreateUserInput, "firstAccessPassword"> {
  id: string
  firstAccessPassword?: string
}
