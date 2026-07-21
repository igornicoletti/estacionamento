import { getSupabaseBrowserClient } from "@/lib"

import type { ProfileUpdateInput } from "../types/profile-types"

const PROFILE_UPDATE_FUNCTION = "profile-update"
const AVATARS_BUCKET = "avatars"
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const MAX_AVATAR_DIMENSION_PX = 4096
const ACCEPTED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export class ProfileServiceError extends Error {
  constructor(message = "Não foi possível atualizar o perfil.") {
    super(message)
    this.name = "ProfileServiceError"
  }
}

function getDevPreviewAvatarPath(value: string | null | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    return null
  }

  return normalized.startsWith("data:image/") || /^https:\/\//i.test(normalized)
    ? normalized
    : null
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

function readAvatarPath(value: unknown) {
  if (typeof value !== "object" || value === null || !("data" in value)) {
    return null
  }

  const data = (value as { data?: unknown }).data

  if (typeof data !== "object" || data === null || !("avatarPath" in data)) {
    return null
  }

  const avatarPath = (data as { avatarPath?: unknown }).avatarPath

  return typeof avatarPath === "string" && avatarPath.trim() ? avatarPath.trim() : null
}

function readPhoneMasked(value: unknown) {
  if (typeof value !== "object" || value === null || !("data" in value)) {
    return null
  }

  const data = (value as { data?: unknown }).data

  if (typeof data !== "object" || data === null || !("phoneMasked" in data)) {
    return null
  }

  const phoneMasked = (data as { phoneMasked?: unknown }).phoneMasked

  return typeof phoneMasked === "string" && phoneMasked.trim() ? phoneMasked.trim() : null
}

function readRequiresPasskeyRegistration(value: unknown) {
  if (typeof value !== "object" || value === null || !("data" in value)) {
    return false
  }

  const data = (value as { data?: unknown }).data

  if (typeof data !== "object" || data === null || !("requiresPasskeyRegistration" in data)) {
    return false
  }

  return (data as { requiresPasskeyRegistration?: unknown }).requiresPasskeyRegistration === true
}

export function validateAvatarFile(file: File) {
  if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
    throw new ProfileServiceError("Envie uma imagem JPG, PNG ou WebP.")
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new ProfileServiceError("A imagem deve ter no máximo 5 MB.")
  }

  if (file.size === 0) {
    throw new ProfileServiceError("O arquivo está vazio ou corrompido.")
  }
}

export async function validateAvatarDimensions(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      if (img.width > MAX_AVATAR_DIMENSION_PX || img.height > MAX_AVATAR_DIMENSION_PX) {
        reject(new ProfileServiceError(`A imagem deve ter no máximo ${MAX_AVATAR_DIMENSION_PX}x${MAX_AVATAR_DIMENSION_PX} pixels.`))
      } else if (img.width === 0 || img.height === 0) {
        reject(new ProfileServiceError("Não foi possível processar a imagem. Verifique se o arquivo não está corrompido."))
      } else {
        resolve()
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new ProfileServiceError("Não foi possível carregar a imagem. Verifique se o arquivo não está corrompido."))
    }

    img.src = objectUrl
  })
}

export function validateAvatarObjectPath(value: string, authUserId: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new ProfileServiceError("Caminho da foto inválido.")
  }

  if (/^(https?:|data:image\/)/i.test(normalized)) {
    throw new ProfileServiceError("Envie a foto pelo formulário. URLs externas não são permitidas.")
  }

  if (normalized.startsWith("/") || normalized.includes("..") || normalized.includes("\\")) {
    throw new ProfileServiceError("Caminho da foto inválido.")
  }

  if (!normalized.startsWith(`${authUserId}/`)) {
    throw new ProfileServiceError("A foto enviada não pertence ao usuário autenticado.")
  }

  if (!/\.(jpe?g|png|webp)$/i.test(normalized)) {
    throw new ProfileServiceError("Formato da foto inválido.")
  }

  return normalized
}

export function validateAvatarImageUrl(value: string) {
  const normalized = value.trim()

  if (!/^https:\/\//i.test(normalized)) {
    throw new ProfileServiceError("Informe uma URL HTTPS válida para a imagem.")
  }

  if (!/\.(jpe?g|png|webp)(\?.*)?$/i.test(normalized)) {
    throw new ProfileServiceError("A URL deve apontar para uma imagem JPG, PNG ou WebP.")
  }

  return normalized
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new ProfileServiceError("Não foi possível processar a imagem."))
      }
    }
    reader.onerror = () => {
      reject(new ProfileServiceError("Não foi possível ler o arquivo."))
    }
    reader.readAsDataURL(file)
  })
}

export async function uploadProfileAvatarFile(file: File, authUserId: string) {
  validateAvatarFile(file)
  await validateAvatarDimensions(file)

  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return readFileAsDataUrl(file)
  }

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
    throw new ProfileServiceError("Não foi possível enviar a foto.")
  }

  return validateAvatarObjectPath(path, authUserId)
}

export async function updateCurrentProfile(input: ProfileUpdateInput) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    const devAvatarPath = getDevPreviewAvatarPath(input.avatarPreviewUrl ?? null)

    return {
      avatarPath: devAvatarPath ?? input.avatarPath ?? null,
      email: input.email?.trim() || null,
      name: input.name.trim(),
      phoneMasked: input.phone?.trim() || null,
      requiresPasskeyRegistration: false,
    }
  }

  const response = await supabase.functions.invoke(PROFILE_UPDATE_FUNCTION, {
    body: {
      avatarPath: input.avatarPath ?? input.avatarPreviewUrl ?? null,
      email: input.email?.trim() || null,
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
    },
  })

  if (response.error) {
    throw new ProfileServiceError(
      (await readFunctionErrorMessage(response.error)) ??
      "Não foi possível atualizar o perfil."
    )
  }

  return {
    avatarPath: readAvatarPath(response.data) ?? input.avatarPath ?? null,
    email: input.email?.trim() || null,
    name: input.name.trim(),
    phoneMasked: readPhoneMasked(response.data),
    requiresPasskeyRegistration: readRequiresPasskeyRegistration(response.data),
  }
}

const PROFILE_CHANGE_PASSWORD_FUNCTION = "profile-change-password"

export async function changeCurrentPassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new ProfileServiceError("Configuração remota indisponível para alterar a senha.")
  }

  const response = await supabase.functions.invoke(PROFILE_CHANGE_PASSWORD_FUNCTION, {
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
  })

  if (response.error) {
    const message = await readFunctionErrorMessage(response.error)
    throw new ProfileServiceError(message ?? "Não foi possível alterar a senha.")
  }
}
