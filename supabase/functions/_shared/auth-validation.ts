import { z } from "npm:zod@4.4.3"

const cpfFormatSchema = z
  .string()
  .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/)

function isValidCpfChecksum(value: string) {
  const digits = value.replace(/\D/g, "")

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false
  }

  const numbers = Array.from(digits, Number)

  const firstCheck = numbers
    .slice(0, 9)
    .reduce((sum, digit, index) => sum + digit * (10 - index), 0)
  const firstDigit = (firstCheck * 10) % 11
  const normalizedFirstDigit = firstDigit === 10 ? 0 : firstDigit

  const secondCheck = numbers
    .slice(0, 10)
    .reduce((sum, digit, index) => sum + digit * (11 - index), 0)
  const secondDigit = (secondCheck * 10) % 11
  const normalizedSecondDigit = secondDigit === 10 ? 0 : secondDigit

  return (
    numbers[9] === normalizedFirstDigit &&
    numbers[10] === normalizedSecondDigit
  )
}

const cpfSchema = cpfFormatSchema.refine(
  isValidCpfChecksum,
  "CPF inválido."
)
const passwordSchema = z.string().min(8).max(128)
const newPasswordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/\d/)
  .regex(/[^A-Za-z0-9]/)

export const authStartSchema = z.object({
  cpf: cpfSchema,
})

export const authPasswordSchema = z.object({
  cpf: cpfSchema,
  flowId: z.string().uuid().nullable().optional(),
  newPassword: newPasswordSchema.optional(),
  password: passwordSchema,
})

export const recoveryRequestSchema = z.object({
  cpf: cpfSchema,
  description: z.string().max(500).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10).max(20),
  reason: z.enum(["lost_phone", "forgot_password", "attempts_blocked", "other"]),
})

export const adminCreateUserSchema = z.object({
  cpf: cpfSchema,
  email: z.string().email().optional(),
  hasOwnEmail: z.boolean(),
  name: z.string().min(3),
  phone: z.string().min(10).max(20),
  role: z.enum(["owner", "admin", "auditor", "manager", "operator"]),
  temporaryPassword: newPasswordSchema,
  unitId: z.string().optional(),
})

export const adminActionSchema = z.object({
  reason: z.string().min(10),
  targetUserId: z.string().uuid(),
})

export const flowCpfSchema = z.object({
  cpf: cpfSchema,
  flowId: z.string().uuid(),
})

export const profilePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: newPasswordSchema,
})

export const profilePhoneSchema = z.object({
  phone: z.string().min(10).max(20),
})
