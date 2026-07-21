import { z } from "zod"

import { isValidCpf } from "@/lib/cpf"

import { authCopy } from "../constants"

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
  return value.replace(/\D/g, "").slice(0, 11)
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

export function formatCpfInput(value: string) {
  const digits = normalizeCpf(value)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatPhoneInput(value: string) {
  const digits = normalizePhone(value)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export const authCpfSchema = z
  .string({ error: authCopy.validation.cpfRequired })
  .trim()
  .min(1, { error: authCopy.validation.cpfRequired })
  .regex(cpfRegex, { error: authCopy.validation.cpfInvalid })
  .refine((value) => isValidCpf(normalizeCpf(value)), {
    error: authCopy.validation.cpfInvalid,
  })

export const authPasswordSchema = z
  .string({ error: authCopy.validation.passwordRequired })
  .min(1, { error: authCopy.validation.passwordRequired })
  .min(8, { error: authCopy.validation.passwordMin })
  .max(128)

export const newPasswordSchema = z
  .string({ error: authCopy.validation.newPasswordRequired })
  .min(12, { error: authCopy.validation.newPasswordMin })
  .max(128)
  .regex(/[A-Z]/, { error: authCopy.validation.newPasswordUppercase })
  .regex(/[a-z]/, { error: authCopy.validation.newPasswordLowercase })
  .regex(/\d/, { error: authCopy.validation.newPasswordNumber })
  .regex(/[^A-Za-z0-9]/, { error: authCopy.validation.newPasswordSymbol })

export const authLoginSchema = z.object({
  cpf: authCpfSchema,
  password: authPasswordSchema,
})

export const requiredPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: z.string({ error: authCopy.validation.confirmPasswordRequired }),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    error: authCopy.validation.confirmPasswordMismatch,
  })

export const authRecoverySchema = z
  .object({
    cpf: authCpfSchema,
    phone: z
      .string({ error: authCopy.validation.recoveryPhoneRequired })
      .trim()
      .min(1, { error: authCopy.validation.recoveryPhoneRequired })
      .min(10, { error: authCopy.validation.recoveryPhoneInvalid })
      .max(20, { error: authCopy.validation.recoveryPhoneInvalid })
      .regex(phoneRegex, { error: authCopy.validation.recoveryPhoneInvalid }),
    email: z
      .union([
        z.literal(""),
        z.email({ error: authCopy.validation.recoveryEmailInvalid }),
      ])
      .optional()
      .transform((value) => value ?? ""),
    reason: z.enum(recoveryReasonValues, {
      error: authCopy.validation.recoveryReasonRequired,
    }),
    description: z
      .string()
      .trim()
      .max(500, { error: authCopy.validation.recoveryDescriptionMax })
      .optional()
      .transform((value) => value ?? ""),
  })
  .superRefine((value, context) => {
    if (value.reason === "other" && value.description.trim().length === 0) {
      context.addIssue({
        code: "custom",
        message: authCopy.validation.recoveryDescriptionRequired,
        path: ["description"],
      })
    }
  })

export interface AuthRecoveryFormValues {
  cpf: string
  phone: string
  email: string
  reason: RecoveryReason | ""
  description: string
}

export type AuthLoginPayload = z.infer<typeof authLoginSchema>
export type RequiredPasswordValues = z.infer<typeof requiredPasswordSchema>
export type AuthRecoveryPayload = z.infer<typeof authRecoverySchema>
export type FieldErrors<T extends object> = Partial<Record<keyof T, string>>

export function getFirstIssueByPath<T extends object>(
  issues: readonly { path: readonly PropertyKey[]; message: string }[]
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
