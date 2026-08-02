import { z } from "zod"

import { securityCopy } from "../constants/security-copy"

export const securityMfaCodeSchema = z.string().regex(/^\d{6}$/u, {
  error: securityCopy.mfaDialog.invalidCode,
})
