import { appCopy } from "@/app/constants"
import { Spinner } from "@/components/ui/spinner"

interface RouteLoadingStateProps {
  scope?: "app" | "page" | "route"
}

export function RouteLoadingState({
  scope = "route",
}: RouteLoadingStateProps) {
  const minHeightClass = scope === "app" ? "min-h-svh" : "min-h-64"

  return (
    <section
      className={`flex ${minHeightClass} flex-1 items-center justify-center bg-background p-6 text-primary`}
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner className="size-6" aria-label={appCopy.loading.route} />
    </section>
  )
}
