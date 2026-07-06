export type BadgeTone = "success" | "info" | "warning" | "destructive"

const badgeToneClassNames: Record<BadgeTone, string> = {
  success:
    "bg-success/10 text-success dark:bg-success/20 dark:text-success-foreground",
  info: "bg-info/10 text-info dark:bg-info/20 dark:text-info-foreground",
  warning:
    "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning-foreground",
  destructive:
    "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive-foreground",
}

export function getBadgeToneClassName(tone?: BadgeTone | null) {
  if (!tone) {
    return undefined
  }

  return badgeToneClassNames[tone]
}
