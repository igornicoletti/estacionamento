export type BadgeTone = "success" | "info" | "warning" | "error" | "secondary"

const badgeToneClassNames: Record<BadgeTone, string> = {
  success:
    "border-success/5 bg-success/10 text-success dark:bg-success/20 dark:text-success-foreground",
  info:
    "border-info/5 bg-info/10 text-info dark:bg-info/20 dark:text-info-foreground",
  warning:
    "border-warning/5 bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning-foreground",
  error:
    "border-error/5 bg-error/10 text-error dark:bg-error/20 dark:text-error-foreground",
  secondary:
    "border-secondary-foreground/5 bg-secondary text-secondary-foreground",
}

export function getBadgeToneClassName(tone?: BadgeTone | null) {
  if (!tone) {
    return undefined
  }

  return badgeToneClassNames[tone]
}
