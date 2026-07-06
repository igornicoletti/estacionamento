type InteractOutsideEvent = {
  target: EventTarget | null
  preventDefault: () => void
}

export function preventDialogCloseOnFloatingLayerInteraction(
  event: InteractOutsideEvent
) {
  const target = event.target

  if (!(target instanceof HTMLElement)) {
    return
  }

  const interactedInsideFloatingLayer = Boolean(
    target.closest("[data-radix-popper-content-wrapper]") ||
    target.closest("[data-slot='select-content']") ||
    target.closest("[data-slot='combobox-content']") ||
    target.closest("[data-slot='popover-content']")
  )

  if (interactedInsideFloatingLayer) {
    event.preventDefault()
  }
}
