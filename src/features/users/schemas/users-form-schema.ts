import { z } from "zod"

import { authCpfSchema, newPasswordSchema } from "@/features/auth/validation"
import { isValidPhone } from "@/lib"

import { requiresSingleUnit, userRoleValues } from "../types/users-types"
import { usersCopy } from "../users-copy"

const userFormModeValues = ["create", "edit"] as const

const optionalEmailSchema = z.union([
  z.literal(""),
  z.email({ error: usersCopy.errors.invalidEmail }),
])

const optionalPhoneSchema = z.union([
  z.literal(""),
  z.string({ error: usersCopy.errors.requiredPhone }).refine(isValidPhone, {
    error: usersCopy.errors.invalidPhone,
  }),
])

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
    phone: optionalPhoneSchema,
    role: z.enum(userRoleValues),
    unitId: z.string().trim().optional(),
    unitName: z.string().trim().optional(),
  })
  .superRefine((values, context) => {
    if (!values.phone.trim()) {
      context.addIssue({
        code: "custom",
        message: usersCopy.errors.requiredPhone,
        path: ["phone"],
      })
    }

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
        message:
          passwordResult.error.issues[0]?.message ?? usersCopy.errors.invalidPassword,
        path: ["firstAccessPassword"],
      })
    }
  })

export type UsersFormValues = z.input<typeof usersFormSchema>
