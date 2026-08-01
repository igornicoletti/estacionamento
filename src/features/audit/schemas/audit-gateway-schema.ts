import { z } from "zod"

import {
  auditScopeValues,
  auditSeverityValues,
} from "../constants/audit-labels"

const auditMetadataSchema = z.record(z.string(), z.unknown()).nullable()
const nonBlankAuditText = (maximumLength: number) =>
  z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim().length > 0)

export const auditEventRowSchema = z
  .object({
    actor: nonBlankAuditText(256),
    actor_user_id: z.uuid().nullable(),
    event: nonBlankAuditText(128),
    id: z.uuid(),
    metadata: auditMetadataSchema,
    occurred_at: z.iso.datetime({ offset: true }),
    reason: z.string().max(4_000).nullable(),
    request_id: z.string().max(256).nullable(),
    scope: z.enum(auditScopeValues),
    severity: z.enum(auditSeverityValues),
    success: z.boolean(),
    target: z.string().max(512),
    target_user_id: z.uuid().nullable(),
  })
  .strict()

export const auditEventRowsSchema = z.array(auditEventRowSchema)

export type AuditEventRowPayload = z.infer<typeof auditEventRowSchema>
