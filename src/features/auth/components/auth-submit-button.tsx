import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface AuthSubmitButtonProps {
  children: string
  disabled?: boolean
  isLoading?: boolean
}

export function AuthSubmitButton({
  children,
  disabled,
  isLoading,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"

      disabled={disabled || isLoading}
      className="w-full"
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </Button>
  )
}
