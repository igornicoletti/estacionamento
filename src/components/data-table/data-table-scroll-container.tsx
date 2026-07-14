import * as React from "react"

import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"

interface DataTableScrollContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  dragThreshold?: number
}

interface DragState {
  pointerId: number | null
  startX: number
  scrollLeft: number
  hasMoved: boolean
}

const DEFAULT_DRAG_THRESHOLD = 3

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(
    target.closest(
      [
        "a",
        "button",
        "input",
        "select",
        "textarea",
        "summary",
        "[contenteditable='true']",
        "[role='button']",
        "[role='checkbox']",
        "[role='combobox']",
        "[role='listbox']",
        "[role='menuitem']",
        "[role='option']",
        "[data-no-drag-scroll='true']",
      ].join(",")
    )
  )
}

export function DataTableScrollContainer({
  children,
  className,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  style,
  ...props
}: DataTableScrollContainerProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const dragState = React.useRef<DragState>({
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  })
  const suppressClick = React.useRef(false)
  const previousBodyCursor = React.useRef("")
  const previousBodyUserSelect = React.useRef("")
  const [isDragging, setIsDragging] = React.useState(false)

  const stopDragging = React.useCallback((pointerId?: number) => {
    const captureElement = scrollRef.current
    const currentPointerId = dragState.current.pointerId

    if (captureElement && currentPointerId !== null) {
      try {
        captureElement.releasePointerCapture(pointerId ?? currentPointerId)
      } catch {
        void 0
      }
    }

    if (dragState.current.hasMoved) {
      suppressClick.current = true
      window.setTimeout(() => {
        suppressClick.current = false
      }, 0)
    }

    dragState.current = {
      pointerId: null,
      startX: 0,
      scrollLeft: 0,
      hasMoved: false,
    }
    document.body.style.cursor = previousBodyCursor.current
    document.body.style.userSelect = previousBodyUserSelect.current
    setIsDragging(false)
  }, [])

  React.useEffect(() => {
    return () => {
      document.body.style.cursor = previousBodyCursor.current
      document.body.style.userSelect = previousBodyUserSelect.current
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label={dataTableCopy.accessibility.scrollableTable}
      tabIndex={0}
      data-dragging={isDragging || undefined}
      className={cn(
        "min-h-0 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "select-none",
        className
      )}
      onPointerDown={(event) => {
        if (event.button !== 0 || isInteractiveElement(event.target)) {
          return
        }

        const scrollElement = scrollRef.current

        if (!scrollElement || scrollElement.scrollWidth <= scrollElement.clientWidth) {
          return
        }

        event.preventDefault()
        dragState.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          scrollLeft: scrollElement.scrollLeft,
          hasMoved: false,
        }
        previousBodyCursor.current = document.body.style.cursor
        previousBodyUserSelect.current = document.body.style.userSelect
        document.body.style.cursor = "grabbing"
        document.body.style.userSelect = "none"
        scrollElement.setPointerCapture(event.pointerId)
        setIsDragging(true)
      }}
      onPointerMove={(event) => {
        const scrollElement = scrollRef.current
        const current = dragState.current

        if (!scrollElement || current.pointerId !== event.pointerId) {
          return
        }

        const deltaX = event.clientX - current.startX

        if (Math.abs(deltaX) > dragThreshold) {
          current.hasMoved = true
        }

        if (current.hasMoved) {
          event.preventDefault()
          scrollElement.scrollLeft = current.scrollLeft - deltaX
        }
      }}
      onPointerLeave={(event) => {
        if (dragState.current.pointerId === event.pointerId) {
          stopDragging(event.pointerId)
        }
      }}
      onPointerUp={(event) => {
        if (dragState.current.pointerId === event.pointerId) {
          stopDragging(event.pointerId)
        }
      }}
      onPointerCancel={(event) => {
        if (dragState.current.pointerId === event.pointerId) {
          stopDragging(event.pointerId)
        }
      }}
      onLostPointerCapture={() => {
        if (dragState.current.pointerId !== null) {
          stopDragging()
        }
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      {...props}
      style={style}
    >
      {children}
    </div>
  )
}
