import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface AuthSubmitButtonProps {
  children: string
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
}

export function AuthSubmitButton({
  children,
  disabled,
  isLoading,
  loadingText = "Autenticando",
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || isLoading}
      className="w-full"
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <>
          <Loader2Icon className="animate-spin" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
