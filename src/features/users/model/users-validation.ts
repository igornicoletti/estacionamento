import { z } from "zod"

import { authCpfSchema, newPasswordSchema } from "@/features/auth/validation"
import { isValidPhone } from "@/lib"

import { usersCopy } from "../constants"
import { requiresSingleUnit, userRoleValues } from "./users-types"

const userFormModeValues = ["create", "edit"] as const

const optionalEmailSchema = z.union([
  z.literal(""),
  z.email({ error: usersCopy.errors.invalidEmail }),
])

const requiredPhoneSchema = z
  .string({ error: usersCopy.errors.requiredPhone })
  .trim()
  .min(1, { error: usersCopy.errors.requiredPhone })
  .refine(isValidPhone, { error: usersCopy.errors.invalidPhone })

export const usersFormSchema = z
  .object({
    cpf: authCpfSchema,
    email: optionalEmailSchema,
    firstAccessPassword: z.string(),
    id: z.string().optional(),
    mode: z.enum(userFormModeValues),
    name: z
      .string({ error: usersCopy.errors.requiredName })
      .trim()
      .min(1, { error: usersCopy.errors.requiredName }),
    phone: requiredPhoneSchema,
    role: z.enum(userRoleValues),
    unitId: z.string().trim().optional(),
    unitName: z.string().trim().optional(),
  })
  .superRefine((values, context) => {
    if (requiresSingleUnit(values.role) && !values.unitId?.trim()) {
      context.addIssue({
        code: "custom",
        message: usersCopy.errors.requiredUnit,
        path: ["unitId"],
      })
    }

    const password = values.firstAccessPassword.trim()

    if (values.mode === "create" && !password) {
      context.addIssue({
        code: "custom",
        message: usersCopy.errors.requiredFirstAccessPassword,
        path: ["firstAccessPassword"],
      })
      return
    }

    if (!password) {
      return
    }

    const passwordResult = newPasswordSchema.safeParse(password)

    if (!passwordResult.success) {
      context.addIssue({
        code: "custom",
        message: passwordResult.error.issues[0]?.message ?? usersCopy.errors.invalidPassword,
        path: ["firstAccessPassword"],
      })
    }
  })

export type UsersFormValues = z.infer<typeof usersFormSchema>

export type UsersFormFieldName = keyof UsersFormValues

export function getUsersFormFieldErrors(error: z.ZodError<UsersFormValues>) {
  return error.issues.reduce<Partial<Record<UsersFormFieldName, string>>>((errors, issue) => {
    const fieldName = issue.path[0]

    if (typeof fieldName === "string" && fieldName in usersFormSchema.shape) {
      errors[fieldName as UsersFormFieldName] = issue.message
    }

    return errors
  }, {})
}
