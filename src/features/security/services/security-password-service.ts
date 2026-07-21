import { readResponseErrorMessage } from "@/lib"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

const PROFILE_CHANGE_PASSWORD_FUNCTION = "profile-change-password"

export class SecurityServiceError extends Error {
  constructor(message = "Não foi possível alterar a senha.") {
    super(message)
    this.name = "SecurityServiceError"
  }
}

export async function changeCurrentPassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new SecurityServiceError("Configuração remota indisponível para alterar a senha.")
  }

  const response = await supabase.functions.invoke(PROFILE_CHANGE_PASSWORD_FUNCTION, {
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
  })

  if (response.error) {
    const message = await readResponseErrorMessage(response.error)
    throw new SecurityServiceError(message ?? "Não foi possível alterar a senha.")
  }
}
