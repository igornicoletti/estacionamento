import { z } from "zod"

import {
  authCpfSchema,
  newPasswordSchema,
} from "@/features/auth"
import { isValidPhone } from "@/lib"

import { usersCopy } from "../constants/users-copy"
import {
  requiresSingleUnit,
  userRoleValues,
  type UserRecord,
  type UserRole,
} from "../model/users-types"

const userFormModeValues = ["create", "edit"] as const

const optionalEmailSchema = z.union([
  z.literal(""),
  z
    .email({ error: usersCopy.errors.invalidEmail })
    .max(254, { error: usersCopy.errors.invalidEmail }),
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
      .min(1, { error: usersCopy.errors.requiredName })
      .min(3, { error: usersCopy.errors.invalidName })
      .max(120, { error: usersCopy.errors.invalidName }),
    phone: requiredPhoneSchema,
    role: z.enum(userRoleValues),
    unitId: z.string().trim().max(64).optional(),
  })
  .superRefine((values, context) => {
    if (values.mode === "edit" && !values.id?.trim()) {
      context.addIssue({
        code: "custom",
        message: usersCopy.errors.userNotFound,
        path: ["id"],
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
          passwordResult.error.issues[0]?.message ??
          usersCopy.errors.invalidPassword,
        path: ["firstAccessPassword"],
      })
    }
  })

export type UsersFormValues = z.infer<typeof usersFormSchema>
export type UsersFormFieldName = keyof UsersFormValues

export function createDefaultUsersFormValues(
  assignableRoles: readonly UserRole[]
): UsersFormValues {
  const defaultRole = assignableRoles.includes("operator")
    ? "operator"
    : assignableRoles[0] ?? "operator"

  return {
    cpf: "",
    email: "",
    firstAccessPassword: "",
    id: undefined,
    mode: "create",
    name: "",
    phone: "",
    role: defaultRole,
    unitId: "",
  }
}

export function mapUserToUsersFormValues(
  user: UserRecord
): UsersFormValues {
  return {
    cpf: user.cpf,
    email: user.email || "",
    firstAccessPassword: "",
    id: user.id,
    mode: "edit",
    name: user.name,
    phone: user.phoneMasked || "",
    role: user.role,
    unitId: user.unitId || "",
  }
}

export function getUsersFormFieldErrors(
  error: z.ZodError<UsersFormValues>
) {
  return error.issues.reduce<
    Partial<Record<UsersFormFieldName, string>>
  >((errors, issue) => {
    const fieldName = issue.path[0]

    if (
      typeof fieldName === "string" &&
      fieldName in usersFormSchema.shape &&
      errors[fieldName as UsersFormFieldName] === undefined
    ) {
      errors[fieldName as UsersFormFieldName] = issue.message
    }

    return errors
  }, {})
}

export function getFirstUsersFormError(
  error: z.ZodError<UsersFormValues>
) {
  return error.issues[0]?.message ?? usersCopy.feedback.create.error
}
