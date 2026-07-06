import { Loader2 } from "lucide-react"

type RouteLoadingVariant = "screen" | "section" | "inline"

interface RouteLoadingProps {
  label?: string
  variant?: RouteLoadingVariant
  className?: string
}

const routeLoadingVariantClassNames: Record<RouteLoadingVariant, string> = {
  inline: "inline-flex items-center justify-center gap-2 text-primary",
  screen: "flex h-svh items-center justify-center overflow-hidden px-6 text-primary",
  section: "flex min-h-64 items-center justify-center rounded-lg px-6 text-primary",
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ")
}

export function RouteLoading({
  label = "Carregando",
  variant = "screen",
  className,
}: RouteLoadingProps) {
  const isInline = variant === "inline"

  return (
    <div
      className={joinClassNames(
        routeLoadingVariantClassNames[variant],
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <Loader2
        className={joinClassNames("animate-spin", isInline ? "size-4" : "size-6")}
        aria-hidden="true"
      />

      {isInline ? (
        <span className="text-sm font-medium">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )
}
