import { z } from "zod"

import { authCopy } from "../auth-copy"
import { authCpfSchema } from "./auth-cpf-schema"
import { authPasswordSchema, newPasswordSchema } from "./auth-password-schema"

export const authLoginSchema = z
  .object({
    cpf: authCpfSchema,
    password: z.string().min(1, authCopy.login.passwordRequired),
    newPassword: newPasswordSchema.optional(),
    confirmNewPassword: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword && value.newPassword !== value.confirmNewPassword) {
      ctx.addIssue({
        code: "custom",
        message: authCopy.login.confirmNewPasswordMismatch,
        path: ["confirmNewPassword"],
      })
    }
  })

const authLoginCredentialsSchema = z.object({
  cpf: authCpfSchema,
  password: authPasswordSchema,
})

const authLoginCredentialsWithNewPasswordSchema = authLoginCredentialsSchema
  .extend({
    confirmNewPassword: z
      .string()
      .min(1, authCopy.login.confirmNewPasswordRequired),
    newPassword: newPasswordSchema,
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmNewPassword) {
      ctx.addIssue({
        code: "custom",
        message: authCopy.login.confirmNewPasswordMismatch,
        path: ["confirmNewPassword"],
      })
    }
  })

export function validateAuthLoginSubmission(
  values: AuthLoginFormValues,
  requiresNewPassword: boolean
) {
  return requiresNewPassword
    ? authLoginCredentialsWithNewPasswordSchema.safeParse(values)
    : authLoginCredentialsSchema.safeParse(values)
}

export interface AuthLoginFormValues {
  confirmNewPassword?: string
  cpf: string
  newPassword?: string
  password: string
}
