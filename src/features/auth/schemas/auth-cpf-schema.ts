import { z } from "zod"

import { formatCpf, isValidCpf } from "@/lib"

export const authCpfSchema = z
  .string()
  .transform(formatCpf)
  .refine(isValidCpf, "Informe um CPF válido.")
