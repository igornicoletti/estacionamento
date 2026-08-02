import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  AppDateTimePicker,
  formatLocalDateTimeValue,
  parseLocalDateTimeValue,
} from "@/components/shared/app-date-time-picker"

describe("AppDateTimePicker", () => {
  it("round-trips local date and time without a UTC shift", () => {
    const localDate = new Date(2026, 7, 1, 14, 35)
    const serialized = formatLocalDateTimeValue(localDate)
    const parsed = parseLocalDateTimeValue(serialized)

    expect(serialized).toBe("2026-08-01T14:35")
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(7)
    expect(parsed?.getDate()).toBe(1)
    expect(parsed?.getHours()).toBe(14)
    expect(parsed?.getMinutes()).toBe(35)
  })

  it("opens the current shadcn Calendar from the form control", () => {
    render(
      <AppDateTimePicker
        id="date-time-test"
        value="2026-08-01T14:35"
        onValueChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /01\/08\/2026/i }))

    expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument()
    expect(screen.getByLabelText("Horário")).toHaveValue("14:35")
  })
})
