import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { formatCpf } from "@/lib"

interface AuthCpfFieldProps {
  disabled?: boolean
  error?: string
  id: string
  value: string
  onValueChange: (value: string) => void
}

export function AuthCpfField({
  disabled,
  error,
  id,
  onValueChange,
  value,
}: AuthCpfFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        CPF <span className="text-destructive">*</span>
      </FieldLabel>
      <Input
        id={id}
        className="h-9"
        value={value}
        onChange={(event) => onValueChange(formatCpf(event.target.value))}
        inputMode="numeric"
        autoComplete="username"
        placeholder="000.000.000-00"
        disabled={disabled}
        aria-invalid={Boolean(error)}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
