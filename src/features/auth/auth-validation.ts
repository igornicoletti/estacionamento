import { z } from "zod"

import { authCopy } from "./auth-copy"

const cpfRegex = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const phoneRegex = /^\+?[0-9\s().-]{10,20}$/

export const recoveryReasonValues = [
  "lost_phone",
  "forgot_password",
  "attempts_blocked",
  "other",
] as const

export type RecoveryReason = (typeof recoveryReasonValues)[number]

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "")
}

function isValidCpfChecksum(value: string) {
  const digits = normalizeCpf(value)

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

export const authCpfSchema = z
  .string()
  .trim()
  .min(1, authCopy.validation.cpfRequired)
  .regex(cpfRegex, authCopy.validation.cpfInvalid)
  .refine(isValidCpfChecksum, authCopy.validation.cpfInvalid)

export const authPasswordSchema = z
  .string()
  .min(1, authCopy.validation.passwordRequired)
  .min(8, authCopy.validation.passwordMin)
  .max(128)

export const newPasswordSchema = z
  .string()
  .min(12, authCopy.validation.newPasswordMin)
  .max(128)
  .regex(/[A-Z]/, authCopy.validation.newPasswordUppercase)
  .regex(/[a-z]/, authCopy.validation.newPasswordLowercase)
  .regex(/\d/, authCopy.validation.newPasswordNumber)
  .regex(/[^A-Za-z0-9]/, authCopy.validation.newPasswordSymbol)

export const authLoginSchema = z.object({
  cpf: authCpfSchema,
  password: authPasswordSchema,
})

export const requiredPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: authCopy.validation.confirmPasswordMismatch,
  })

export const authRecoverySchema = z.object({
  cpf: authCpfSchema,
  phone: z
    .string()
    .trim()
    .min(1, authCopy.validation.recoveryPhoneRequired)
    .min(10, authCopy.validation.recoveryPhoneInvalid)
    .max(20, authCopy.validation.recoveryPhoneInvalid)
    .regex(phoneRegex, authCopy.validation.recoveryPhoneInvalid),
  email: z
    .union([
      z.literal(""),
      z.string().trim().email(authCopy.validation.recoveryEmailInvalid),
    ])
    .optional()
    .transform((value) => value ?? ""),
  reason: z.enum(recoveryReasonValues, {
    error: authCopy.validation.recoveryReasonRequired,
  }),
  description: z
    .string()
    .trim()
    .max(500, authCopy.validation.recoveryDescriptionMax)
    .optional()
    .transform((value) => value ?? ""),
})

export type AuthLoginPayload = z.infer<typeof authLoginSchema>
export type RequiredPasswordValues = z.infer<typeof requiredPasswordSchema>
export type AuthRecoveryPayload = z.infer<typeof authRecoverySchema>
export type FieldErrors<T extends object> = Partial<Record<keyof T, string>>

export function getFirstIssueByPath<T extends object>(
  issues: readonly { path: readonly (string | number)[]; message: string }[]
) {
  const errors: FieldErrors<T> = {}

  for (const issue of issues) {
    const key = issue.path[0]

    if (typeof key === "string" && !(key in errors)) {
      errors[key as keyof T] = issue.message
    }
  }

  return errors
}
