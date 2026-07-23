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

interface OverflowState {
  horizontal: boolean
  vertical: boolean
}

const DEFAULT_DRAG_THRESHOLD = 4
const CLICK_SUPPRESSION_TIMEOUT_MS = 250

const INTERACTIVE_ELEMENT_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[draggable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='link']",
  "[role='listbox']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[role='option']",
  "[role='radio']",
  "[role='searchbox']",
  "[role='slider']",
  "[role='spinbutton']",
  "[role='switch']",
  "[role='tab']",
  "[role='textbox']",
  "[tabindex]:not([tabindex='-1'])",
  "[data-no-drag-scroll='true']",
].join(",")

function createInitialDragState(): DragState {
  return {
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  }
}

function normalizeDragThreshold(
  value: number
): number {
  return Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_DRAG_THRESHOLD
}

function isInteractiveElement(
  target: EventTarget | null,
  boundary: Element
): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  const interactiveElement = target.closest(
    INTERACTIVE_ELEMENT_SELECTOR
  )

  return Boolean(
    interactiveElement &&
    interactiveElement !== boundary &&
    boundary.contains(interactiveElement)
  )
}

export function DataTableScrollContainer({
  children,
  className,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  enableDragScroll = true,
  style,
  role: providedRole,
  tabIndex: providedTabIndex,
  onPointerDown: externalOnPointerDown,
  onPointerMove: externalOnPointerMove,
  onPointerUp: externalOnPointerUp,
  onPointerCancel: externalOnPointerCancel,
  onLostPointerCapture:
  externalOnLostPointerCapture,
  onClickCapture: externalOnClickCapture,
  ...props
}: DataTableScrollContainerProps) {
  const scrollRef =
    React.useRef<HTMLDivElement>(null)

  const dragState = React.useRef<DragState>(
    createInitialDragState()
  )

  const suppressClick = React.useRef(false)

  const clickSuppressionTimeout =
    React.useRef<number | null>(null)

  const [isDragging, setIsDragging] =
    React.useState(false)

  const [overflowState, setOverflowState] =
    React.useState<OverflowState>({
      horizontal: false,
      vertical: false,
    })

  const normalizedDragThreshold =
    normalizeDragThreshold(dragThreshold)

  const updateOverflowState =
    React.useCallback(() => {
      const scrollElement =
        scrollRef.current

      if (!scrollElement) {
        return
      }

      const nextState: OverflowState = {
        horizontal:
          scrollElement.scrollWidth >
          scrollElement.clientWidth + 1,
        vertical:
          scrollElement.scrollHeight >
          scrollElement.clientHeight + 1,
      }

      setOverflowState((previousState) => {
        if (
          previousState.horizontal ===
          nextState.horizontal &&
          previousState.vertical ===
          nextState.vertical
        ) {
          return previousState
        }

        return nextState
      })
    }, [])

  React.useEffect(() => {
    updateOverflowState()
  }, [children, updateOverflowState])

  React.useEffect(() => {
    const scrollElement =
      scrollRef.current

    if (!scrollElement) {
      return
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(
          updateOverflowState
        )
        : null

    function observeResizeTargets() {
      resizeObserver?.disconnect()
      resizeObserver?.observe(scrollElement)

      for (const child of Array.from(
        scrollElement.children
      )) {
        resizeObserver?.observe(child)
      }
    }

    observeResizeTargets()

    const mutationObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
          observeResizeTargets()
          updateOverflowState()
        })
        : null

    mutationObserver?.observe(scrollElement, {
      childList: true,
    })

    window.addEventListener(
      "resize",
      updateOverflowState
    )

    return () => {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()

      window.removeEventListener(
        "resize",
        updateOverflowState
      )
    }
  }, [updateOverflowState])

  const clearClickSuppressionTimeout =
    React.useCallback(() => {
      if (
        clickSuppressionTimeout.current ===
        null
      ) {
        return
      }

      window.clearTimeout(
        clickSuppressionTimeout.current
      )

      clickSuppressionTimeout.current = null
    }, [])

  const armClickSuppression =
    React.useCallback(() => {
      clearClickSuppressionTimeout()

      suppressClick.current = true

      clickSuppressionTimeout.current =
        window.setTimeout(() => {
          suppressClick.current = false
          clickSuppressionTimeout.current =
            null
        }, CLICK_SUPPRESSION_TIMEOUT_MS)
    }, [clearClickSuppressionTimeout])

  React.useEffect(() => {
    return () => {
      clearClickSuppressionTimeout()
    }
  }, [clearClickSuppressionTimeout])

  const finishDragging = React.useCallback(
    (releaseCapture: boolean) => {
      const scrollElement =
        scrollRef.current

      const {
        pointerId,
        hasMoved,
      } = dragState.current

      if (pointerId === null) {
        return
      }

      dragState.current =
        createInitialDragState()

      setIsDragging(false)

      if (hasMoved) {
        armClickSuppression()
      }

      if (
        releaseCapture &&
        scrollElement?.hasPointerCapture(
          pointerId
        )
      ) {
        try {
          scrollElement.releasePointerCapture(
            pointerId
          )
        } catch {
          // A captura pode ter sido liberada
          // pelo navegador entre a verificação
          // e esta chamada.
        }
      }
    },
    [armClickSuppression]
  )

  const hasScrollableOverflow =
    overflowState.horizontal ||
    overflowState.vertical

  const resolvedRole =
    providedRole ??
    (hasScrollableOverflow
      ? "region"
      : undefined)

  const providedAriaLabel =
    props["aria-label"]

  const providedAriaLabelledBy =
    props["aria-labelledby"]

  const resolvedAriaLabel =
    providedAriaLabel ??
    (resolvedRole === "region" &&
      !providedAriaLabelledBy
      ? dataTableCopy.accessibility
        .scrollableTable
      : undefined)

  const resolvedTabIndex =
    providedTabIndex ??
    (hasScrollableOverflow ? 0 : undefined)

  return (
    <div
      {...props}
      ref={scrollRef}
      role={resolvedRole}
      aria-label={resolvedAriaLabel}
      tabIndex={resolvedTabIndex}
      data-scrollable-x={
        overflowState.horizontal ||
        undefined
      }
      data-scrollable-y={
        overflowState.vertical ||
        undefined
      }
      data-dragging={
        isDragging || undefined
      }
      className={cn(
        "min-h-0 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging &&
        "cursor-grabbing select-none",
        className
      )}
      style={style}
      onPointerDown={(event) => {
        externalOnPointerDown?.(event)

        if (
          event.defaultPrevented ||
          !enableDragScroll ||
          event.pointerType !== "mouse" ||
          !event.isPrimary ||
          event.button !== 0 ||
          isInteractiveElement(
            event.target,
            event.currentTarget
          )
        ) {
          return
        }

        const scrollElement =
          event.currentTarget

        if (
          scrollElement.scrollWidth <=
          scrollElement.clientWidth + 1
        ) {
          return
        }

        suppressClick.current = false
        clearClickSuppressionTimeout()

        dragState.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          scrollLeft:
            scrollElement.scrollLeft,
          hasMoved: false,
        }

        try {
          scrollElement.setPointerCapture(
            event.pointerId
          )
        } catch {
          dragState.current =
            createInitialDragState()
        }
      }}
      onPointerMove={(event) => {
        externalOnPointerMove?.(event)

        if (event.defaultPrevented) {
          return
        }

        const currentDrag =
          dragState.current

        if (
          currentDrag.pointerId !==
          event.pointerId
        ) {
          return
        }

        if (event.buttons === 0) {
          finishDragging(true)
          return
        }

        const deltaX =
          event.clientX -
          currentDrag.startX

        if (
          !currentDrag.hasMoved &&
          Math.abs(deltaX) <=
          normalizedDragThreshold
        ) {
          return
        }

        if (!currentDrag.hasMoved) {
          currentDrag.hasMoved = true
          setIsDragging(true)
        }

        event.preventDefault()

        event.currentTarget.scrollLeft =
          currentDrag.scrollLeft - deltaX
      }}
      onPointerUp={(event) => {
        if (
          dragState.current.pointerId ===
          event.pointerId
        ) {
          finishDragging(true)
        }

        externalOnPointerUp?.(event)
      }}
      onPointerCancel={(event) => {
        if (
          dragState.current.pointerId ===
          event.pointerId
        ) {
          finishDragging(true)
        }

        externalOnPointerCancel?.(event)
      }}
      onLostPointerCapture={(event) => {
        if (
          dragState.current.pointerId ===
          event.pointerId
        ) {
          finishDragging(false)
        }

        externalOnLostPointerCapture?.(
          event
        )
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault()
          event.stopPropagation()

          suppressClick.current = false
          clearClickSuppressionTimeout()

          return
        }

        externalOnClickCapture?.(event)
      }}
    >
      {children}
    </div>
  )
}
