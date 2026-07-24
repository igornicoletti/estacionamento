import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  formatCnpj,
  formatCpf,
  formatCpfCnpj,
  onlyDigits,
} from "@/lib/cpf"
import { formatPhone } from "@/lib/phone"
import { cn } from "@/lib/utils"

export type DataTableSensitiveValueKind =
  | "cpf"
  | "cnpj"
  | "cpfCnpj"
  | "phone"
  | "text"
export type DataTableSensitiveValueState = "auto" | "raw" | "masked"
export type DataTableSensitiveMaskMode = "full" | "partial"

export interface DataTableSensitiveValueRevealContext {
  kind: DataTableSensitiveValueKind
}

export interface DataTableSensitiveValueProps {
  value: string | null | undefined
  kind?: DataTableSensitiveValueKind
  fallback?: React.ReactNode
  className?: string
  valueState?: DataTableSensitiveValueState
  canReveal?: boolean
  maskMode?: DataTableSensitiveMaskMode
  maskValue?: (
    value: string,
    kind: DataTableSensitiveValueKind
  ) => string
  revealLabel?: string
  autoHideMs?: number
  onReveal?: (context: DataTableSensitiveValueRevealContext) => void
}

const DEFAULT_AUTO_HIDE_MS = 10_000
const MIN_AUTO_HIDE_MS = 1_000
const MAX_AUTO_HIDE_MS = 60_000
const GENERIC_FULL_MASK = "••••••"
const MASK_CHARACTER_PATTERN = /[*•]/u
const STRUCTURED_VALUE_PATTERN = /^[\d\s()./+()-]+$/u

const sensitiveValueLabels: Record<DataTableSensitiveValueKind, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  cpfCnpj: "CPF ou CNPJ",
  phone: "Telefone",
  text: "Valor",
}

function normalizeAccessibleText(value: string | undefined): string {
  return value?.trim().replace(/\s+/gu, " ") ?? ""
}

function normalizeAutoHideMs(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_AUTO_HIDE_MS
  }
  return Math.min(
    Math.max(Math.round(value), MIN_AUTO_HIDE_MS),
    MAX_AUTO_HIDE_MS
  )
}

function resolveValueState(
  value: string,
  kind: DataTableSensitiveValueKind,
  valueState: DataTableSensitiveValueState
): "raw" | "masked" {
  if (valueState !== "auto") return valueState
  return kind !== "text" && MASK_CHARACTER_PATTERN.test(value)
    ? "masked"
    : "raw"
}

export function formatDataTableSensitiveValue(
  value: string,
  kind: DataTableSensitiveValueKind
): string {
  const normalized = value.trim()
  if (!normalized || kind === "text") return normalized
  if (!STRUCTURED_VALUE_PATTERN.test(normalized)) return normalized

  const digits = onlyDigits(normalized)
  if (kind === "cpf" && digits.length === 11) return formatCpf(digits)
  if (kind === "cnpj" && digits.length === 14) return formatCnpj(digits)
  if (
    kind === "cpfCnpj" &&
    (digits.length === 11 || digits.length === 14)
  ) {
    return formatCpfCnpj(digits)
  }
  if (
    kind === "phone" &&
    (digits.length === 10 || digits.length === 11)
  ) {
    return formatPhone(digits)
  }
  return normalized
}

function maskGenericText(
  value: string,
  mode: DataTableSensitiveMaskMode
): string {
  if (mode === "full") return GENERIC_FULL_MASK
  const characters = Array.from(value)
  return characters.length
    ? `${GENERIC_FULL_MASK}${characters.slice(-2).join("")}`
    : GENERIC_FULL_MASK
}

export function maskDataTableSensitiveValue(
  value: string,
  kind: DataTableSensitiveValueKind,
  maskMode: DataTableSensitiveMaskMode = "full"
): string {
  const normalized = value.trim()
  if (!normalized) return ""

  const digits = onlyDigits(normalized)
  if ((kind === "cpf" || kind === "cpfCnpj") && digits.length === 11) {
    return maskMode === "partial"
      ? `***.***.***-${digits.slice(-2)}`
      : "***.***.***-**"
  }
  if ((kind === "cnpj" || kind === "cpfCnpj") && digits.length === 14) {
    return maskMode === "partial"
      ? `**.***.***/****-${digits.slice(-2)}`
      : "**.***.***/****-**"
  }
  if (
    kind === "phone" &&
    (digits.length === 10 || digits.length === 11)
  ) {
    const subscriberMask = digits.length === 11 ? "*****" : "****"
    return maskMode === "partial"
      ? `(**) ${subscriberMask}-${digits.slice(-4)}`
      : `(**) ${subscriberMask}-****`
  }

  return maskGenericText(normalized, maskMode)
}

export function DataTableSensitiveValue({
  value,
  kind = "text",
  fallback = "—",
  className,
  valueState = "auto",
  canReveal = false,
  maskMode = "full",
  maskValue,
  revealLabel = "Alternar visualização do conteúdo completo",
  autoHideMs = DEFAULT_AUTO_HIDE_MS,
  onReveal,
}: DataTableSensitiveValueProps) {
  const normalizedValue = value?.trim() ?? ""
  const descriptionId = React.useId()
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [revealedContextKey, setRevealedContextKey] = React.useState<
    string | null
  >(null)

  const resolvedValueState = resolveValueState(
    normalizedValue,
    kind,
    valueState
  )

  const revealContextKey = [
    canReveal ? "revealable" : "protected",
    kind,
    resolvedValueState,
    normalizedValue,
  ].join(":")

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [revealContextKey])

  if (!normalizedValue) {
    return fallback
  }

  const displayValue =
    resolvedValueState === "masked"
      ? normalizedValue
      : formatDataTableSensitiveValue(normalizedValue, kind)
  const customMaskedValue =
    resolvedValueState === "raw" && maskValue
      ? maskValue(normalizedValue, kind).trim()
      : ""
  const maskedValue =
    resolvedValueState === "masked"
      ? normalizedValue
      : customMaskedValue ||
        maskDataTableSensitiveValue(normalizedValue, kind, maskMode)
  const canInteract =
    canReveal &&
    resolvedValueState === "raw" &&
    displayValue !== maskedValue
  const isRevealed =
    canInteract && revealedContextKey === revealContextKey
  const baseClassName = cn("tabular-nums", className)

  if (!canInteract) {
    return (
      <span className={cn("inline-block max-w-full break-all", baseClassName)}>
        {maskedValue}
      </span>
    )
  }

  const currentValue = isRevealed ? displayValue : maskedValue
  const stateDescription = isRevealed
    ? `${sensitiveValueLabels[kind]} completo visível: ${currentValue}.`
    : `${sensitiveValueLabels[kind]} mascarado: ${currentValue}.`

  function clearAutoHideTimeout() {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function hideValue() {
    clearAutoHideTimeout()
    setRevealedContextKey(null)
  }

  function revealValue() {
    clearAutoHideTimeout()
    setRevealedContextKey(revealContextKey)
    onReveal?.({ kind })

    timeoutRef.current = setTimeout(() => {
      setRevealedContextKey(null)
      timeoutRef.current = null
    }, normalizeAutoHideMs(autoHideMs))
  }

  return (
    <Button
      data-no-drag-scroll="true"
      type="button"
      variant="ghost"
      size="sm"
      aria-label={
        normalizeAccessibleText(revealLabel) ||
        "Alternar visualização do conteúdo completo"
      }
      aria-describedby={descriptionId}
      aria-pressed={isRevealed}
      title={
        isRevealed
          ? "Ocultar conteúdo completo"
          : "Mostrar conteúdo completo"
      }
      className={cn(
        "h-auto max-w-full justify-start whitespace-normal break-all px-1 py-0.5 text-left font-normal",
        baseClassName
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        if (isRevealed) hideValue()
        else revealValue()
      }}
      onBlur={hideValue}
    >
      <span aria-hidden="true">{currentValue}</span>
      <span id={descriptionId} className="sr-only">
        {stateDescription}
      </span>
    </Button>
  )
}
