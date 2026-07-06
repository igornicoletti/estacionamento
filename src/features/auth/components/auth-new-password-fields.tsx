import { AuthPasswordField } from "./auth-password-field"

interface AuthNewPasswordFieldsProps {
  confirmError?: string
  confirmValue: string
  description?: string
  disabled?: boolean
  passwordError?: string
  passwordValue: string
  onConfirmValueChange: (value: string) => void
  onPasswordValueChange: (value: string) => void
}

export function AuthNewPasswordFields({
  confirmError,
  confirmValue,
  description = "8 caracteres, incluindo letras maiúsculas, minúsculas e números",
  disabled,
  onConfirmValueChange,
  onPasswordValueChange,
  passwordError,
  passwordValue,
}: AuthNewPasswordFieldsProps) {
  return (
    <>
      <AuthPasswordField
        id="auth-new-password"
        label="Nova senha"
        value={passwordValue}
        onValueChange={onPasswordValueChange}
        error={passwordError}
        disabled={disabled}
        autoComplete="new-password"
        description={description}
      />
      <AuthPasswordField
        id="auth-confirm-new-password"
        label="Confirmar senha"
        value={confirmValue}
        onValueChange={onConfirmValueChange}
        error={confirmError}
        disabled={disabled}
        autoComplete="new-password"
      />
    </>
  )
}
