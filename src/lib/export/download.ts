/**
 * Triggers a browser download for the given [Blob]. No-op in non-DOM
 * environments (e.g. SSR or unit tests) so callers can invoke it safely.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  anchor.style.display = "none"

  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

/**
 * Appends a timestamp (YYYY-MM-DD_HH-mm-ss) to a base filename so repeated
 * exports do not overwrite each other, then applies the extension.
 */
export function buildTimestampedFilename(
  baseName: string,
  extension: string,
  date: Date = new Date()
): string {
  const pad = (value: number) => String(value).padStart(2, "0")

  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-")

  const time = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-")

  const normalizedExtension = extension.startsWith(".")
    ? extension
    : `.${extension}`

  const safeBase = baseName.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "")

  return `${safeBase || "export"}_${stamp}_${time}${normalizedExtension}`
}
