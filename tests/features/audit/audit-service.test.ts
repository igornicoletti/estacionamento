import { afterEach, describe, expect, it } from "vitest"

import {
  resetAuditGateway,
  setAuditGateway,
} from "@/features/audit/gateways/audit-gateway"
import { listAuditEvents } from "@/features/audit/services/audit-service"
import {
  createAuditEventRow,
  createMemoryAuditGateway,
} from "../../helpers/audit-memory-gateway"

describe("audit service", () => {
  afterEach(() => {
    resetAuditGateway()
  })

  it("maps the gateway result without hiding truncation", async () => {
    setAuditGateway(
      createMemoryAuditGateway(
        [
          createAuditEventRow({
            event: "client_synced",
            id: "00000000-0000-4000-8000-000000000002",
          }),
        ],
        { isTruncated: true }
      )
    )

    const snapshot = await listAuditEvents()

    expect(snapshot.isTruncated).toBe(true)
    expect(snapshot.events).toEqual([
      expect.objectContaining({
        actor: "Rede Monte Carlo",
        event: "client_synced",
      }),
    ])
  })
})
