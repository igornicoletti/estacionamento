import { z } from "zod"

import {
  authCpfSchema,
  newPasswordSchema,
  requiresSingleUnit,
  userRoleValues,
} from "@/features/auth"
import { isValidPhone } from "@/lib"

import { usersCopy } from "../users-copy"

const userFormModeValues = ["create", "edit"] as const

const optionalEmailSchema = z.union([
  z.literal(""),
  z.string().trim().email("Informe um e-mail válido."),
])

const optionalPhoneSchema = z.union([
  z.literal(""),
  z.string().refine(isValidPhone, "Informe um telefone válido."),
])

export const usersFormSchema = z
  .object({
    cpf: authCpfSchema,
    email: optionalEmailSchema,
    firstAccessPassword: z.string(),
    id: z.string().optional(),
    mode: z.enum(userFormModeValues),
    name: z.string().trim().min(1, "Informe o nome do usuário."),
    phone: optionalPhoneSchema,
    role: z.enum(userRoleValues),
    unitId: z.string().trim().optional(),
    unitName: z.string().trim().optional(),
  })
  .superRefine((values, context) => {
    if (!values.phone.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: usersCopy.errors.requiredPhone,
        path: ["phone"],
      })
    }

    if (requiresSingleUnit(values.role) && !values.unitId?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: usersCopy.errors.requiredUnit,
        path: ["unitId"],
      })
    }

    const password = values.firstAccessPassword.trim()

    if (values.mode === "create" && !password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
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
        code: z.ZodIssueCode.custom,
        message:
          passwordResult.error.issues[0]?.message ?? usersCopy.errors.invalidPassword,
        path: ["firstAccessPassword"],
      })
    }
  })

export type UsersFormValues = z.input<typeof usersFormSchema>
