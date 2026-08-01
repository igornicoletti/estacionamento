export type BadgeTone = "success" | "info" | "warning" | "destructive"

const badgeToneClassNames: Record<BadgeTone, string> = {
  success:
    "bg-success-subtle text-success dark:text-success-foreground",
  info: "bg-info-subtle text-info dark:text-info-foreground",
  warning:
    "bg-warning-subtle text-warning dark:text-warning-foreground",
  destructive:
    "bg-destructive-subtle text-destructive dark:text-destructive-foreground",
}

export function getBadgeToneClassName(tone?: BadgeTone | null) {
  if (!tone) {
    return undefined
  }

  return badgeToneClassNames[tone]
}
