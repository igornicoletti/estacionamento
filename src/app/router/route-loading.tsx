import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type RouteLoadingVariant = "screen" | "section" | "inline"

interface RouteLoadingProps {
  className?: string
  label?: string
  variant?: RouteLoadingVariant
}

const routeLoadingVariantClassNames: Record<RouteLoadingVariant, string> = {
  inline: "inline-flex items-center justify-center gap-2 text-primary",
  screen:
    "flex h-svh items-center justify-center overflow-hidden px-6 text-primary",
  section:
    "flex min-h-64 items-center justify-center rounded-lg px-6 text-primary",
}

export function RouteLoading({
  className,
  label = "Carregando",
  variant = "screen",
}: RouteLoadingProps) {
  const isInline = variant === "inline"

  return (
    <div
      className={cn(routeLoadingVariantClassNames[variant], className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <Spinner className={cn(isInline ? "size-4" : "size-6")} />
      {isInline ? (
        <span className="text-sm font-medium">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )
}
