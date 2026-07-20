import { type ReactNode } from "react"

import { toastCopy, type ToastMessageKey } from "./toast-copy"

export type ToastMessageDescriptor = {
  key: ToastMessageKey
  values?: Record<string, string | number>
}

export type ToastMessageInput = string | ReactNode | ToastMessageDescriptor

const HTML_TAG_REGEX = /<[^>]*>/g
const MULTIPLE_SPACES_REGEX = /\s+/g
const TECHNICAL_MESSAGE_REGEX = /(TypeError|ReferenceError|SyntaxError|\b\w*Error\b|Exception|Unhandled|stack|trace|HTTP\s*\d{3}|status\s*\d{3}|ECONN|SQL|RPC|Supabase|Postgres|JSON|Unexpected token|Cannot read|at\s+[A-Za-z0-9_.]+\s*\(|Failed to fetch|Network Error)/i

function isToastMessageKey(value: unknown): value is ToastMessageKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(toastCopy.messages, value)
  )
}

function isToastMessageDescriptor(
  value: ToastMessageInput
): value is ToastMessageDescriptor {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "key" in value &&
    isToastMessageKey(value.key)
  )
}

function normalizeDictionaryKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.!?]+$/g, "")
    .toLowerCase()
    .trim()
}

function interpolateMessage(
  message: string,
  values: Record<string, string | number> | undefined
) {
  if (!values) {
    return message
  }

  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    message
  )
}

function removeControlCharacters(value: string) {
  return Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0

      return codePoint <= 31 || codePoint === 127 ? " " : character
    })
    .join("")
}

export function sanitizeToastText(value: string, fallback: string) {
  const sanitized = removeControlCharacters(value.replace(HTML_TAG_REGEX, " "))
    .replace(MULTIPLE_SPACES_REGEX, " ")
    .trim()

  if (!sanitized) {
    return fallback
  }

  // Nunca expor detalhes técnicos para o usuário final.
  if (TECHNICAL_MESSAGE_REGEX.test(sanitized)) {
    return fallback
  }

  return sanitized
}

export function resolveToastMessage(
  input: ToastMessageInput | undefined,
  fallbackKey: ToastMessageKey
): ReactNode {
  const fallback = toastCopy.messages[fallbackKey]

  if (!input) {
    return fallback
  }

  if (input instanceof Error) {
    return sanitizeToastText(input.message, fallback)
  }

  if (typeof input === "string") {
    const translated =
      toastCopy.translations[
      normalizeDictionaryKey(input) as keyof typeof toastCopy.translations
      ] ?? input

    return sanitizeToastText(translated, fallback)
  }

  if (isToastMessageDescriptor(input)) {
    return sanitizeToastText(
      interpolateMessage(toastCopy.messages[input.key], input.values),
      fallback
    )
  }

  return input
}
