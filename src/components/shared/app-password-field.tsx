"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

type InputGroupInputProps = React.ComponentProps<typeof InputGroupInput>

export type AppPasswordFieldProps = Omit<
  InputGroupInputProps,
  "aria-describedby" | "aria-invalid" | "className" | "id" | "type"
> & {
  id: string
  label: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  labelAction?: React.ReactNode
  className?: string
}

export function AppPasswordField({
  id,
  label,
  description,
  error,
  labelAction,
  required = true,
  autoComplete = "current-password",
  disabled,
  className,
  ...props
}: AppPasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined
  const visibilityLabel = isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
  const VisibilityIcon = isPasswordVisible ? EyeOffIcon : EyeIcon

  return (
    <Field data-invalid={Boolean(error)} className={cn(className)}>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </FieldLabel>

        {labelAction ? (
          <div className="shrink-0 text-sm">{labelAction}</div>
        ) : null}
      </div>

      <InputGroup>
        <InputGroupInput
          id={id}
          type={isPasswordVisible ? "text" : "password"}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />

        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label={visibilityLabel}
            aria-pressed={isPasswordVisible}
            disabled={disabled}
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            <VisibilityIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}

      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  )
}
