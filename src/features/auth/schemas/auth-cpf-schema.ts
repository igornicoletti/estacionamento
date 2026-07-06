import { z } from "zod"

import { formatCpf, isValidCpf, onlyDigits } from "@/lib"

export const authCpfSchema = z
  .string()
  .transform(formatCpf)
  .refine(isValidCpf, "Informe um CPF válido.")

export const normalizedCpfSchema = authCpfSchema.transform(onlyDigits)
