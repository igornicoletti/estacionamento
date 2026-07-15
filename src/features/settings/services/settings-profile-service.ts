import { getSupabaseBrowserClient } from "@/lib"

import type { SettingsProfileUpdateInput } from "../types/settings-types"

const PROFILE_UPDATE_FUNCTION = "profile-update"
const AVATARS_BUCKET = "avatars"
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const MAX_AVATAR_DIMENSION_PX = 4096
const ACCEPTED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export class SettingsProfileError extends Error {
  constructor(message = "Não foi possível atualizar o perfil.") {
    super(message)
    this.name = "SettingsProfileError"
  }
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new SettingsProfileError("Configuração remota indisponível.")
  }

  return supabase
}

async function readFunctionErrorMessage(error: unknown) {
  const context =
    typeof error === "object" && error !== null && "context" in error
      ? (error as { context?: unknown }).context
      : null

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { message?: unknown }

      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message
      }
    } catch {
      return null
    }
  }

  return error instanceof Error && error.message.trim() ? error.message : null
}

function getAvatarExtension(file: File) {
  if (file.type === "image/png") {
    return "png"
  }

  if (file.type === "image/webp") {
    return "webp"
  }

  return "jpg"
}

export function validateAvatarFile(file: File) {
  if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
    throw new SettingsProfileError("Envie uma imagem JPG, PNG ou WebP.")
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new SettingsProfileError("A imagem deve ter no máximo 5 MB.")
  }

  if (file.size === 0) {
    throw new SettingsProfileError("O arquivo está vazio ou corrompido.")
  }
}

export async function validateAvatarDimensions(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      if (img.width > MAX_AVATAR_DIMENSION_PX || img.height > MAX_AVATAR_DIMENSION_PX) {
        reject(new SettingsProfileError(`A imagem deve ter no máximo ${MAX_AVATAR_DIMENSION_PX}x${MAX_AVATAR_DIMENSION_PX} pixels.`))
      } else if (img.width === 0 || img.height === 0) {
        reject(new SettingsProfileError("Não foi possível processar a imagem. Verifique se o arquivo não está corrompido."))
      } else {
        resolve()
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new SettingsProfileError("Não foi possível carregar a imagem. Verifique se o arquivo não está corrompido."))
    }

    img.src = objectUrl
  })
}

export function validateAvatarUrl(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  try {
    const url = new URL(normalized)

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("unsupported")
    }

    return url.toString()
  } catch {
    throw new SettingsProfileError("Informe uma URL de imagem válida.")
  }
}

export async function uploadProfileAvatarFile(file: File, authUserId: string) {
  validateAvatarFile(file)

  const supabase = getSupabaseOrThrow()
  const extension = getAvatarExtension(file)
  const path = `${authUserId}/avatar-${Date.now()}.${extension}`
  const uploadResponse = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    })

  if (uploadResponse.error) {
    throw new SettingsProfileError("Não foi possível enviar a foto.")
  }

  return path
}

export async function updateCurrentProfile(input: SettingsProfileUpdateInput) {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.functions.invoke(PROFILE_UPDATE_FUNCTION, {
    body: {
      avatarUrl: input.avatarUrl,
      email: input.email?.trim() || null,
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
    },
  })

  if (response.error) {
    throw new SettingsProfileError(
      (await readFunctionErrorMessage(response.error)) ??
      "Não foi possível atualizar o perfil."
    )
  }

  return {
    avatarUrl: input.avatarUrl,
    email: input.email?.trim() || null,
    name: input.name.trim(),
    phoneMasked: input.phone?.trim() || null,
  }
}
