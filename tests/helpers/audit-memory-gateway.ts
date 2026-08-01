import { type AuditGateway } from "@/features/audit/gateways/audit-gateway-contracts"
import { type AuditEventRowPayload } from "@/features/audit/schemas/audit-gateway-schema"

const defaultAuditEventRow: AuditEventRowPayload = {
  actor: "Rede Monte Carlo",
  actor_user_id: null,
  event: "unit_synced",
  id: "00000000-0000-4000-8000-000000000001",
  metadata: { mode: "incremental" },
  occurred_at: "2026-07-02T11:20:19Z",
  reason: null,
  request_id: "req-test",
  scope: "system",
  severity: "info",
  success: true,
  target: "Unidades",
  target_user_id: null,
}

export function createAuditEventRow(
  overrides: Partial<AuditEventRowPayload> = {}
): AuditEventRowPayload {
  return { ...defaultAuditEventRow, ...overrides }
}

export function createMemoryAuditGateway(
  rows: readonly AuditEventRowPayload[] = [createAuditEventRow()],
  options: { isTruncated?: boolean } = {}
): AuditGateway {
  return {
    listEvents: () =>
      Promise.resolve({
        isTruncated: options.isTruncated ?? false,
        rows,
      }),
  }
}
