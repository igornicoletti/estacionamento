import { describe, expect, it } from "vitest"

import { readResponseErrorMessage } from "@/lib"

function createFunctionHttpError(response: Response) {
  return Object.assign(
    new Error("Edge Function returned a non-2xx status code"),
    {
      context: response,
      name: "FunctionsHttpError",
    }
  )
}

describe("errors", () => {
  it("reads sanitized messages from Supabase function error responses", async () => {
    const error = createFunctionHttpError(
      new Response(
        JSON.stringify({
          message: "Não foi possível continuar com os dados informados.",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      )
    )

    await expect(readResponseErrorMessage(error)).resolves.toBe(
      "Não foi possível continuar com os dados informados."
    )
  })

  it("does not expose SDK technical text when a function response has no safe message", async () => {
    const error = createFunctionHttpError(
      new Response("Internal Server Error", { status: 500 })
    )

    await expect(readResponseErrorMessage(error)).resolves.toBeNull()
  })

  it("keeps plain application errors readable", async () => {
    await expect(readResponseErrorMessage(new Error("Falha validada."))).resolves.toBe(
      "Falha validada."
    )
  })
})
