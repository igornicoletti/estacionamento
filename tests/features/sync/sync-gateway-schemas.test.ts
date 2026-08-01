import { describe, expect, it } from "vitest"

import {
  clientSyncRunWireSchema,
  syncPhaseResultSchema,
  unitSyncRunWireSchema,
} from "@/features/sync/schemas/sync-gateway-schemas"
import {
  createClientSyncRun,
  createUnitSyncRun,
} from "../../helpers/sync-memory-gateway"

describe("sync gateway schemas", () => {
  it("accepts canonical histories and phase result", () => {
    expect(unitSyncRunWireSchema.safeParse(createUnitSyncRun()).success).toBe(true)
    expect(clientSyncRunWireSchema.safeParse(createClientSyncRun()).success).toBe(true)
    expect(
      syncPhaseResultSchema.safeParse({
        runId: "11111111-1111-4111-8111-111111111111",
        status: "success",
        message: "Concluída.",
      }).success
    ).toBe(true)
  })

  it("rejects unexpected fields and invalid status", () => {
    expect(
      unitSyncRunWireSchema.safeParse({
        ...createUnitSyncRun(),
        secret: "must-not-cross",
      }).success
    ).toBe(false)
    expect(
      syncPhaseResultSchema.safeParse({
        runId: null,
        status: "running",
        message: "Executando.",
      }).success
    ).toBe(false)
  })
})
