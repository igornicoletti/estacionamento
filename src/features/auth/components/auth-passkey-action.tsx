import { FingerprintIcon, Loader2Icon } from "lucide-react"
import { type ComponentProps } from "react"

import { Button } from "@/components/ui/button"

interface AuthPasskeyActionProps {
  disabled?: boolean
  isLoading?: boolean
  label: string
  onClick: () => void
  variant?: ComponentProps<typeof Button>["variant"]
}

export function AuthPasskeyAction({
  disabled,
  isLoading,
  label,
  onClick,
  variant = "default",
}: AuthPasskeyActionProps) {
  return (
    <Button
      type="button"

      variant={variant}
      className="w-full"
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      onClick={onClick}
    >
      {isLoading ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : (
        <FingerprintIcon aria-hidden="true" />
      )}
      {label}
    </Button>
  )
}
