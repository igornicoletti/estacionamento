import { z } from "zod"

export const authPasswordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.")

export const newPasswordSchema = z
  .string()
  .min(12, "A nova senha deve ter pelo menos 12 caracteres.")
  .max(128, "A nova senha deve ter no máximo 128 caracteres.")
  .regex(/[A-Z]/, "Inclua pelo menos uma letra maiúscula.")
  .regex(/[a-z]/, "Inclua pelo menos uma letra minúscula.")
  .regex(/\d/, "Inclua pelo menos um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua pelo menos um caractere especial.")
