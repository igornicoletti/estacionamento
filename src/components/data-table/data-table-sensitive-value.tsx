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

export type DataTableSensitiveValueState =
  | "auto"
  | "raw"
  | "masked"

export type DataTableSensitiveMaskMode =
  | "full"
  | "partial"

export interface DataTableSensitiveValueRevealContext {
  kind: DataTableSensitiveValueKind
}

export interface DataTableSensitiveValueProps {
  value: string | null | undefined
  kind?: DataTableSensitiveValueKind
  fallback?: React.ReactNode
  className?: string

  /**
   * "raw": o valor recebido é integral.
   * "masked": o valor já veio mascarado.
   * "auto": detecta máscara apenas em valores estruturados.
   */
  valueState?: DataTableSensitiveValueState

  /**
   * Deve ser true somente quando a autorização já
   * tiver sido resolvida pela feature/backend.
   */
  canReveal?: boolean

  /**
   * "full" é o padrão mais conservador.
   */
  maskMode?: DataTableSensitiveMaskMode

  /**
   * Permite substituir a política padrão de máscara.
   */
  maskValue?: (
    value: string,
    kind: DataTableSensitiveValueKind
  ) => string

  /**
   * Nome acessível estável do toggle.
   */
  revealLabel?: string

  /**
   * Tempo máximo de exposição do valor integral.
   * Valores são limitados entre 1 e 60 segundos.
   */
  autoHideMs?: number

  /**
   * Ponto de integração para auditoria/telemetria.
   * Não substitui autorização ou auditoria no backend.
   */
  onReveal?: (
    context: DataTableSensitiveValueRevealContext
  ) => void
}

const DEFAULT_AUTO_HIDE_MS = 10_000
const MIN_AUTO_HIDE_MS = 1_000
const MAX_AUTO_HIDE_MS = 60_000

const GENERIC_FULL_MASK = "••••••"

const MASK_CHARACTER_PATTERN = /[*•]/u

const STRUCTURED_VALUE_PATTERN =
  /^[\d\s()./+()-]+$/u

const sensitiveValueLabels: Record<
  DataTableSensitiveValueKind,
  string
> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  cpfCnpj: "CPF ou CNPJ",
  phone: "Telefone",
  text: "Valor",
}

function normalizeAccessibleText(
  value: string | undefined
): string {
  return (
    value
      ?.trim()
      .replace(/\s+/gu, " ") ?? ""
  )
}

function normalizeAutoHideMs(
  value: number | undefined
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_AUTO_HIDE_MS
  }

  return Math.min(
    Math.max(
      Math.round(value),
      MIN_AUTO_HIDE_MS
    ),
    MAX_AUTO_HIDE_MS
  )
}

function isStructuredKind(
  kind: DataTableSensitiveValueKind
): boolean {
  return kind !== "text"
}

function resolveValueState(
  value: string,
  kind: DataTableSensitiveValueKind,
  valueState: DataTableSensitiveValueState
): Exclude<
  DataTableSensitiveValueState,
  "auto"
> {
  if (valueState !== "auto") {
    return valueState
  }

  if (
    isStructuredKind(kind) &&
    MASK_CHARACTER_PATTERN.test(value)
  ) {
    return "masked"
  }

  return "raw"
}

export function formatDataTableSensitiveValue(
  value: string,
  kind: DataTableSensitiveValueKind
): string {
  const normalizedValue = value.trim()

  if (
    normalizedValue.length === 0 ||
    kind === "text"
  ) {
    return normalizedValue
  }

  if (
    !STRUCTURED_VALUE_PATTERN.test(
      normalizedValue
    )
  ) {
    return normalizedValue
  }

  const digits = onlyDigits(normalizedValue)

  if (
    kind === "cpf" &&
    digits.length === 11
  ) {
    return formatCpf(digits)
  }

  if (
    kind === "cnpj" &&
    digits.length === 14
  ) {
    return formatCnpj(digits)
  }

  if (
    kind === "cpfCnpj" &&
    (digits.length === 11 ||
      digits.length === 14)
  ) {
    return formatCpfCnpj(digits)
  }

  if (
    kind === "phone" &&
    (digits.length === 10 ||
      digits.length === 11)
  ) {
    return formatPhone(digits)
  }

  return normalizedValue
}

function maskGenericText(
  value: string,
  maskMode: DataTableSensitiveMaskMode
): string {
  if (maskMode === "full") {
    return GENERIC_FULL_MASK
  }

  const characters = Array.from(value)

  if (characters.length === 0) {
    return GENERIC_FULL_MASK
  }

  const visibleSuffix = characters
    .slice(-2)
    .join("")

  return `${GENERIC_FULL_MASK}${visibleSuffix}`
}

export function maskDataTableSensitiveValue(
  value: string,
  kind: DataTableSensitiveValueKind,
  maskMode: DataTableSensitiveMaskMode =
    "full"
): string {
  const normalizedValue = value.trim()

  if (normalizedValue.length === 0) {
    return ""
  }

  const digits = onlyDigits(normalizedValue)

  if (
    kind === "cpf" &&
    digits.length === 11
  ) {
    return maskMode === "partial"
      ? `***.***.***-${digits.slice(-2)}`
      : "***.***.***-**"
  }

  if (
    kind === "cnpj" &&
    digits.length === 14
  ) {
    return maskMode === "partial"
      ? `**.***.***/****-${digits.slice(-2)}`
      : "**.***.***/****-**"
  }

  if (
    kind === "cpfCnpj" &&
    digits.length === 11
  ) {
    return maskMode === "partial"
      ? `***.***.***-${digits.slice(-2)}`
      : "***.***.***-**"
  }

  if (
    kind === "cpfCnpj" &&
    digits.length === 14
  ) {
    return maskMode === "partial"
      ? `**.***.***/****-${digits.slice(-2)}`
      : "**.***.***/****-**"
  }

  if (
    kind === "phone" &&
    (digits.length === 10 ||
      digits.length === 11)
  ) {
    const subscriberMask =
      digits.length === 11
        ? "*****"
        : "****"

    return maskMode === "partial"
      ? `(**) ${subscriberMask}-${digits.slice(-4)}`
      : `(**) ${subscriberMask}-****`
  }

  return maskGenericText(
    normalizedValue,
    maskMode
  )
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
  revealLabel =
  "Alternar visualização do conteúdo completo",
  autoHideMs = DEFAULT_AUTO_HIDE_MS,
  onReveal,
}: DataTableSensitiveValueProps) {
  const normalizedValue = value?.trim() ?? ""

  const [isRevealed, setIsRevealed] =
    React.useState(false)

  const descriptionId = React.useId()

  const autoHideTimeoutRef =
    React.useRef<
      ReturnType<typeof setTimeout> | null
    >(null)

  const clearAutoHideTimeout =
    React.useCallback(() => {
      if (
        autoHideTimeoutRef.current === null
      ) {
        return
      }

      clearTimeout(
        autoHideTimeoutRef.current
      )

      autoHideTimeoutRef.current = null
    }, [])

  const hideValue =
    React.useCallback(() => {
      clearAutoHideTimeout()
      setIsRevealed(false)
    }, [clearAutoHideTimeout])

  React.useEffect(() => {
    return () => {
      clearAutoHideTimeout()
    }
  }, [clearAutoHideTimeout])

  const resolvedValueState =
    resolveValueState(
      normalizedValue,
      kind,
      valueState
    )

  React.useEffect(() => {
    hideValue()
  }, [
    canReveal,
    hideValue,
    kind,
    normalizedValue,
    resolvedValueState,
  ])

  if (normalizedValue.length === 0) {
    return fallback
  }

  const displayValue =
    resolvedValueState === "masked"
      ? normalizedValue
      : formatDataTableSensitiveValue(
        normalizedValue,
        kind
      )

  const customMaskedValue =
    resolvedValueState === "raw" &&
      maskValue
      ? maskValue(normalizedValue, kind)
        .trim()
      : ""

  const maskedValue =
    resolvedValueState === "masked"
      ? normalizedValue
      : customMaskedValue ||
      maskDataTableSensitiveValue(
        normalizedValue,
        kind,
        maskMode
      )

  const canInteract =
    canReveal &&
    resolvedValueState === "raw" &&
    displayValue !== maskedValue

  const baseClassName = cn(
    "tabular-nums",
    className
  )

  if (!canInteract) {
    return (
      <span
        className={cn(
          "inline-block max-w-full break-all",
          baseClassName
        )}
      >
        {maskedValue}
      </span>
    )
  }

  const normalizedRevealLabel =
    normalizeAccessibleText(revealLabel) ||
    "Alternar visualização do conteúdo completo"

  const normalizedAutoHideMs =
    normalizeAutoHideMs(autoHideMs)

  const valueLabel =
    sensitiveValueLabels[kind]

  const currentValue =
    isRevealed
      ? displayValue
      : maskedValue

  const stateDescription =
    isRevealed
      ? `${valueLabel} completo visível: ${currentValue}.`
      : `${valueLabel} mascarado: ${currentValue}.`

  function revealValue() {
    clearAutoHideTimeout()

    setIsRevealed(true)

    onReveal?.({
      kind,
    })

    autoHideTimeoutRef.current =
      setTimeout(() => {
        setIsRevealed(false)
        autoHideTimeoutRef.current = null
      }, normalizedAutoHideMs)
  }

  return (
    <Button
      data-no-drag-scroll="true"
      type="button"
      variant="ghost"
      size="sm"
      aria-label={
        normalizedRevealLabel
      }
      aria-describedby={
        descriptionId
      }
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
      onPointerDown={(event) => {
        event.stopPropagation()
      }}
      onClick={(event) => {
        event.stopPropagation()

        if (isRevealed) {
          hideValue()
          return
        }

        revealValue()
      }}
      onBlur={hideValue}
    >
      <span aria-hidden="true">
        {currentValue}
      </span>

      <span
        id={descriptionId}
        className="sr-only"
      >
        {stateDescription}
      </span>
    </Button>
  )
}
