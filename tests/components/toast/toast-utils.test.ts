import { describe, expect, it } from "vitest"

import {
  resolveToastMessage,
  sanitizeToastText,
} from "@/components/toast/toast-utils"

describe("toast utils", () => {
  it("sanitizes control characters and html-like tags", () => {
    expect(sanitizeToastText("  <b>Salvo</b>\n\t ", "Fallback")).toBe("Salvo")
  })

  it("uses a fallback for empty sanitized text", () => {
    expect(sanitizeToastText(" \n\t ", "Fallback")).toBe("Fallback")
  })

  it("translates known user-facing messages", () => {
    expect(resolveToastMessage("Saved successfully", "common.success")).toBe(
      "Salvo com sucesso."
    )
  })

  it("interpolates keyed messages before displaying them", () => {
    expect(
      resolveToastMessage(
        { key: "common.error", values: { id: "USR-001" } },
        "common.error"
      )
    ).toBe("Não foi possível concluir a operação.")
  })
})
