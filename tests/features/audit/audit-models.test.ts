import { describe, expect, it } from "vitest"

import { getAuditEventDetails } from "@/features/audit/model/audit-event-details"
import { getAuditEventLabel } from "@/features/audit/model/audit-event-labels"
import {
  sortAuditEvents,
  toAuditEvent,
} from "@/features/audit/model/audit-models"
import { resolveAuditSeverityVariant } from "@/features/audit/model/audit-outcome"
import { createAuditEventRow } from "../../helpers/audit-memory-gateway"

describe("audit models", () => {
  it("preserves canonical evidence while redacting presentation-only details", () => {
    const reason = "Falha em https://internal.example.test/token"
    const event = toAuditEvent(
      createAuditEventRow({
        metadata: {
          mode: "incremental",
          secret: "must-not-be-presented",
        },
        reason,
      })
    )

    expect(event.reason).toBe(reason)

    const details = getAuditEventDetails(event)
    const reasonDetail = details.find((item) => item.id === "reason")

    expect(reasonDetail?.value).toBe("Falha em serviço externo")
    expect(details.some((item) => item.label === "Secret")).toBe(false)
    expect(details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "id", value: event.id }),
        expect.objectContaining({ id: "requestId", value: "req-test" }),
      ])
    )
  })

  it("maps current writers and keeps intentional historical aliases readable", () => {
    expect(getAuditEventLabel("client_synced")).toBe(
      "Clientes sincronizados"
    )
    expect(getAuditEventLabel("unit_synced")).toBe("Unidades sincronizadas")
    expect(getAuditEventLabel("passkeys_removed")).toBe("Passkeys removidas")
    expect(getAuditEventLabel("client.synced")).toBe(
      "Clientes sincronizados"
    )
  })

  it("sorts by instant and uses the id as a deterministic tie breaker", () => {
    const older = toAuditEvent(
      createAuditEventRow({
        id: "00000000-0000-4000-8000-000000000001",
        occurred_at: "2026-07-02T10:00:00-03:00",
      })
    )
    const newer = toAuditEvent(
      createAuditEventRow({
        id: "00000000-0000-4000-8000-000000000002",
        occurred_at: "2026-07-02T13:30:00Z",
      })
    )

    expect(sortAuditEvents([older, newer]).map((event) => event.id)).toEqual([
      newer.id,
      older.id,
    ])
  })

  it("distinguishes critical severity from warning", () => {
    expect(resolveAuditSeverityVariant("critical")).toBe("destructive")
    expect(resolveAuditSeverityVariant("warning")).toBe("warning")
    expect(resolveAuditSeverityVariant("info")).toBe("info")
  })
})
