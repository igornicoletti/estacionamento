import * as React from "react"

export function isRenderable(value: React.ReactNode) {
  return value !== null && value !== undefined && value !== false
}
