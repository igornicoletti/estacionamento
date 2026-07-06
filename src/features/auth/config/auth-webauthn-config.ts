import { env } from "@/config/env"

export const authWebAuthnConfig = {
  rpId: env.webauthnRpId,
  expectedOrigin: env.appOrigin,
} as const
