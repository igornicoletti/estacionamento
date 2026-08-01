import { z } from "zod"

const integerSourceSchema = z.union([z.number(), z.string()])

export function sourceSafeIntegerSchema({
  minimum = 0,
}: {
  minimum?: number
} = {}) {
  return integerSourceSchema.transform((value, context) => {
    const parsed = typeof value === "number" ? value : Number(value)

    if (!Number.isSafeInteger(parsed) || parsed < minimum) {
      context.addIssue({
        code: "custom",
        message: "Valor inteiro fora do intervalo seguro.",
      })

      return z.NEVER
    }

    return parsed
  })
}
