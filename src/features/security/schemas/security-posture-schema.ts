import { z } from "zod"

const nullableTimestampSchema = z.iso.datetime({ offset: true }).nullable()

export const securitySessionSchema = z
  .object({
    aal: z.enum(["aal1", "aal2"]).nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    current: z.boolean(),
    ipAddress: z.string().trim().max(64).nullable(),
    lastSeenAt: z.iso.datetime({ offset: true }),
    reviewed: z.boolean(),
    trusted: z.boolean(),
    userAgent: z.string().trim().max(1_024).nullable(),
  })
  .strict()

export const securityPostureSchema = z
  .object({
    currentLevel: z.enum(["aal1", "aal2"]),
    currentSessionTrusted: z.boolean(),
    mfaConfigured: z.boolean(),
    recentLoginsReviewed: z.boolean(),
    sessions: z.array(securitySessionSchema).max(50),
    trustedDevicesConfigured: z.boolean(),
  })
  .strict()

export const securityMutationTimestampSchema = nullableTimestampSchema.unwrap()

export type SecurityPostureWire = z.infer<typeof securityPostureSchema>
