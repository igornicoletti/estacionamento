import * as React from "react"

import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"

interface DataTableScrollContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  dragThreshold?: number
  enableDragScroll?: boolean
}

interface DragState {
  pointerId: number | null
  startX: number
  scrollLeft: number
  hasMoved: boolean
}

const DEFAULT_DRAG_THRESHOLD = 4
const INTERACTIVE_ELEMENT_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[draggable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='link']",
  "[role='listbox']",
  "[role='menuitem']",
  "[role='option']",
  "[role='searchbox']",
  "[role='textbox']",
  "[tabindex]:not([tabindex='-1'])",
  "[data-no-drag-scroll='true']",
].join(",")

function createInitialDragState(): DragState {
  return { pointerId: null, startX: 0, scrollLeft: 0, hasMoved: false }
}

function isInteractiveElement(
  target: EventTarget | null,
  boundary: Element
): boolean {
  if (!(target instanceof Element)) return false
  const interactive = target.closest(INTERACTIVE_ELEMENT_SELECTOR)
  return Boolean(
    interactive && interactive !== boundary && boundary.contains(interactive)
  )
}

export function DataTableScrollContainer({
  children,
  className,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  enableDragScroll = true,
  role: providedRole,
  tabIndex: providedTabIndex,
  onPointerDown: externalOnPointerDown,
  onPointerMove: externalOnPointerMove,
  onPointerUp: externalOnPointerUp,
  onPointerCancel: externalOnPointerCancel,
  onLostPointerCapture: externalOnLostPointerCapture,
  onClickCapture: externalOnClickCapture,
  ...props
}: DataTableScrollContainerProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const dragState = React.useRef<DragState>(createInitialDragState())
  const suppressClick = React.useRef(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [hasOverflow, setHasOverflow] = React.useState(false)
  const threshold =
    Number.isFinite(dragThreshold) && dragThreshold >= 0
      ? dragThreshold
      : DEFAULT_DRAG_THRESHOLD

  const updateOverflow = React.useCallback(() => {
    const element = ref.current
    if (!element) return
    setHasOverflow(
      element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1
    )
  }, [])

  React.useEffect(() => {
    updateOverflow()
    const element = ref.current
    if (!element) return

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateOverflow)
        : null
    resizeObserver?.observe(element)
    for (const child of Array.from(element.children)) {
      resizeObserver?.observe(child)
    }

    const mutationObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(updateOverflow)
        : null
    mutationObserver?.observe(element, { childList: true, subtree: true })
    window.addEventListener("resize", updateOverflow)

    return () => {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener("resize", updateOverflow)
    }
  }, [children, updateOverflow])

  const finishDragging = React.useCallback((releaseCapture: boolean) => {
    const element = ref.current
    const { pointerId, hasMoved } = dragState.current
    if (pointerId === null) return

    dragState.current = createInitialDragState()
    setIsDragging(false)
    if (hasMoved) suppressClick.current = true

    if (releaseCapture && element?.hasPointerCapture(pointerId)) {
      try {
        element.releasePointerCapture(pointerId)
      } catch {
        // O navegador pode liberar a captura antes desta chamada.
      }
    }
  }, [])

  const resolvedRole = providedRole ?? (hasOverflow ? "region" : undefined)
  const ariaLabel =
    props["aria-label"] ??
    (resolvedRole === "region" && !props["aria-labelledby"]
      ? dataTableCopy.accessibility.scrollableTable
      : undefined)

  return (
    <div
      {...props}
      ref={ref}
      role={resolvedRole}
      aria-label={ariaLabel}
      tabIndex={providedTabIndex ?? (hasOverflow ? 0 : undefined)}
      data-dragging={isDragging || undefined}
      className={cn(
        "min-h-0 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "cursor-grabbing select-none",
        className
      )}
      onPointerDown={(event) => {
        externalOnPointerDown?.(event)
        if (
          event.defaultPrevented ||
          !enableDragScroll ||
          event.pointerType !== "mouse" ||
          !event.isPrimary ||
          event.button !== 0 ||
          isInteractiveElement(event.target, event.currentTarget) ||
          event.currentTarget.scrollWidth <= event.currentTarget.clientWidth + 1
        ) {
          return
        }

        dragState.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          scrollLeft: event.currentTarget.scrollLeft,
          hasMoved: false,
        }
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          dragState.current = createInitialDragState()
        }
      }}
      onPointerMove={(event) => {
        externalOnPointerMove?.(event)
        if (
          event.defaultPrevented ||
          dragState.current.pointerId !== event.pointerId
        ) {
          return
        }
        if (event.buttons === 0) {
          finishDragging(true)
          return
        }

        const deltaX = event.clientX - dragState.current.startX
        if (!dragState.current.hasMoved && Math.abs(deltaX) <= threshold) return
        if (!dragState.current.hasMoved) {
          dragState.current.hasMoved = true
          setIsDragging(true)
        }
        event.preventDefault()
        event.currentTarget.scrollLeft =
          dragState.current.scrollLeft - deltaX
      }}
      onPointerUp={(event) => {
        if (dragState.current.pointerId === event.pointerId) finishDragging(true)
        externalOnPointerUp?.(event)
      }}
      onPointerCancel={(event) => {
        if (dragState.current.pointerId === event.pointerId) finishDragging(true)
        externalOnPointerCancel?.(event)
      }}
      onLostPointerCapture={(event) => {
        if (dragState.current.pointerId === event.pointerId) finishDragging(false)
        externalOnLostPointerCapture?.(event)
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault()
          event.stopPropagation()
          suppressClick.current = false
          return
        }
        externalOnClickCapture?.(event)
      }}
    >
      {children}
    </div>
  )
}
