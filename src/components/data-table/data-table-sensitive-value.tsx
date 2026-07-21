import * as React from "react"

import {
  formatCnpj,
  formatCpf,
  formatCpfCnpj,
  formatPhone,
  onlyDigits,
} from "@/lib"
import { cn } from "@/lib/utils"

type SensitiveValueKind = "cpf" | "cnpj" | "cpfCnpj" | "phone" | "text"

interface DataTableSensitiveValueProps {
  value: string | null | undefined
  kind?: SensitiveValueKind
  fallback?: React.ReactNode
  className?: string
  revealLabel?: string
}

function maskCpf(value: string) {
  const digits = onlyDigits(value)

  if (digits.length !== 11) {
    return maskText(value)
  }

  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`
}

function maskCnpj(value: string) {
  const digits = onlyDigits(value)

  if (digits.length !== 14) {
    return maskText(value)
  }

  return `${digits.slice(0, 2)}.***.***/****-${digits.slice(-2)}`
}

function maskPhone(value: string) {
  const digits = onlyDigits(value)

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`
  }

  return maskText(value)
}

function maskText(value: string) {
  const normalized = value.trim()

  if (normalized.length <= 4) {
    return normalized
  }

  return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`
}

function formatDisplayValue(value: string, kind: SensitiveValueKind) {
  if (value.includes("*")) {
    return value
  }

  if (kind === "cpf") {
    return formatCpf(value)
  }

  if (kind === "cnpj") {
    return formatCnpj(value)
  }

  if (kind === "cpfCnpj") {
    return formatCpfCnpj(value)
  }

  if (kind === "phone") {
    return formatPhone(value)
  }

  return value
}

function maskSensitiveValue(value: string, kind: SensitiveValueKind) {
  if (value.includes("*")) {
    return value
  }

  if (kind === "cpf") {
    return maskCpf(value)
  }

  if (kind === "cnpj") {
    return maskCnpj(value)
  }

  if (kind === "cpfCnpj") {
    const digits = onlyDigits(value)

    if (digits.length === 11) {
      return maskCpf(value)
    }

    if (digits.length === 14) {
      return maskCnpj(value)
    }

    return maskText(value)
  }

  if (kind === "phone") {
    return maskPhone(value)
  }

  return maskText(value)
}

export function DataTableSensitiveValue({
  value,
  kind = "text",
  fallback = "—",
  className,
  revealLabel = "Segure para visualizar o conteúdo completo",
}: DataTableSensitiveValueProps) {
  const normalizedValue = value?.trim()
  const [isPressed, setIsPressed] = React.useState(false)

  if (!normalizedValue) {
    return fallback
  }

  const displayValue = formatDisplayValue(normalizedValue, kind)
  const maskedValue = maskSensitiveValue(normalizedValue, kind)
  const canReveal = maskedValue !== displayValue

  if (!canReveal) {
    return <span className={className}>{displayValue}</span>
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={revealLabel}
      title={revealLabel}
      className={cn("cursor-pointer select-none tabular-nums", className)}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onBlur={() => setIsPressed(false)}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault()
          setIsPressed(true)
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          setIsPressed(false)
        }
      }}
    >
      {isPressed ? displayValue : maskedValue}
    </span>
  )
}
