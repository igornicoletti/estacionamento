import { z } from "zod"

import { isValidPhone } from "@/lib"

import { authCpfSchema } from "./auth-cpf-schema"

const recoveryReasonValues = [
  "lost_phone",
  "forgot_password",
  "attempts_blocked",
  "other",
] as const

export const authRecoverySchema = z
  .object({
    cpf: authCpfSchema,
    phone: z.string().refine(isValidPhone, "Informe um telefone válido."),
    reason: z.enum(recoveryReasonValues, {
      error: "Selecione o motivo da solicitação.",
    }),
    description: z.string().max(500, "Use no máximo 500 caracteres.").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.reason === "other" && !value.description?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Descreva o motivo da solicitação.",
        path: ["description"],
      })
    }
  })

export type AuthRecoveryFormValues = z.input<typeof authRecoverySchema>
export type RecoveryReason = (typeof recoveryReasonValues)[number]
