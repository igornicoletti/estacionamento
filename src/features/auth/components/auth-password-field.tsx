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

interface AuthPasswordFieldProps {
  autoComplete?: string
  description?: string
  disabled?: boolean
  error?: string
  id: string
  label: string
  labelAction?: React.ReactNode
  placeholder?: string
  required?: boolean
  value: string
  onValueChange: (value: string) => void
}

export function AuthPasswordField({
  autoComplete = "current-password",
  description,
  disabled,
  error,
  id,
  label,
  labelAction,
  onValueChange,
  placeholder = "••••••••••••",
  required = true,
  value,
}: AuthPasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const visibilityLabel = showPassword ? "Ocultar senha" : "Mostrar senha"
  const VisibilityIcon = showPassword ? EyeOffIcon : EyeIcon
  const descriptionId = description ? `${id}-description` : undefined

  return (
    <Field data-invalid={Boolean(error)}>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </FieldLabel>
        {labelAction ? (
          <div className="shrink-0 text-sm">{labelAction}</div>
        ) : null}
      </div>
      <InputGroup className="h-9">
        <InputGroupInput
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            aria-label={visibilityLabel}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            <VisibilityIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {
        description ? (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        ) : null
      }
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
