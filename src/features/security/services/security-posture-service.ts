import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  securityMutationTimestampSchema,
  securityPostureSchema,
} from "../schemas/security-posture-schema"
import {
  type SecurityMfaEnrollment,
  type SecurityPosture,
} from "../types/security-types"
import {
  getBrowserName,
  getOperatingSystem,
} from "./security-session-service"

export class SecurityPostureError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = "SecurityPostureError"
  }
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new SecurityPostureError(
      "Não foi possível acessar as configurações de segurança."
    )
  }

  return supabase
}

export async function getSecurityPosture(): Promise<SecurityPosture> {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.rpc("get_current_security_posture")

  if (response.error) {
    throw new SecurityPostureError(
      "Não foi possível carregar as configurações de segurança.",
      response.error
    )
  }

  const parsed = securityPostureSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new SecurityPostureError(
      "As configurações de segurança retornaram dados inválidos.",
      parsed.error
    )
  }

  return {
    ...parsed.data,
    sessions: parsed.data.sessions.map(({ userAgent, ...session }) => ({
      ...session,
      browser: getBrowserName(userAgent ?? ""),
      operatingSystem: getOperatingSystem(userAgent ?? ""),
    })),
  }
}

async function executeTimestampMutation(
  functionName:
    | "review_current_security_logins"
    | "trust_current_security_device",
  errorMessage: string
) {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.rpc(functionName)

  if (response.error) {
    throw new SecurityPostureError(errorMessage, response.error)
  }

  const parsed = securityMutationTimestampSchema.safeParse(response.data)

  if (!parsed.success) {
    throw new SecurityPostureError(errorMessage, parsed.error)
  }

  return parsed.data
}

export function reviewRecentSecurityLogins() {
  return executeTimestampMutation(
    "review_current_security_logins",
    "Não foi possível registrar a revisão dos logins."
  )
}

export function trustCurrentSecurityDevice() {
  return executeTimestampMutation(
    "trust_current_security_device",
    "Confirme a autenticação de dois fatores antes de confiar neste dispositivo."
  )
}

export async function enrollSecurityTotp(): Promise<SecurityMfaEnrollment> {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Aplicativo autenticador",
  })

  if (response.error || !response.data.totp) {
    throw new SecurityPostureError(
      "Não foi possível iniciar a autenticação de dois fatores.",
      response.error
    )
  }

  return {
    factorId: response.data.id,
    qrCode: response.data.totp.qr_code,
    secret: response.data.totp.secret,
  }
}

export async function verifySecurityTotp(
  factorId: string,
  code: string
) {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  })

  if (response.error) {
    throw new SecurityPostureError(
      "O código informado não pôde ser verificado.",
      response.error
    )
  }

  const auditResponse = await supabase.rpc(
    "record_current_security_mfa_enabled"
  )

  if (auditResponse.error) {
    throw new SecurityPostureError(
      "A autenticação foi verificada, mas o registro de auditoria falhou.",
      auditResponse.error
    )
  }

  const parsedAuditTimestamp = securityMutationTimestampSchema.safeParse(
    auditResponse.data
  )

  if (!parsedAuditTimestamp.success) {
    throw new SecurityPostureError(
      "A autenticação foi verificada, mas o registro de auditoria falhou.",
      parsedAuditTimestamp.error
    )
  }
}

export async function cancelSecurityTotpEnrollment(factorId: string) {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.auth.mfa.unenroll({ factorId })

  if (response.error) {
    throw new SecurityPostureError(
      "Não foi possível cancelar a configuração do autenticador.",
      response.error
    )
  }
}
