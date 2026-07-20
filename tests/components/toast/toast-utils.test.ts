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

  it("uses a fallback for technical stack-like content", () => {
    expect(
      sanitizeToastText(
        "TypeError: Cannot read properties of undefined at updateStatus (notifications.ts:10)",
        "Fallback"
      )
    ).toBe("Fallback")
  })

  it("uses a fallback for technical http status content", () => {
    expect(sanitizeToastText("HTTP 500 - Internal Server Error", "Fallback")).toBe("Fallback")
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

  it("sanitizes Error instances before displaying them", () => {
    const technicalError = new Error("Unhandled Exception: Failed to fetch")

    expect(
      resolveToastMessage(technicalError as unknown as string, "common.error")
    ).toBe("Não foi possível concluir a operação.")
  })
})
