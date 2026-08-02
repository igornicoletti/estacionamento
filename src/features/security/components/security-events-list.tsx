import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { securityCopy } from "../constants/security-copy"
import { type SecurityEventSummary } from "../types/security-types"

const eventDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
})

function formatEventDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? securityCopy.events.unavailableDate
    : eventDateFormatter.format(date)
}

function EventSkeletons() {
  return (
    <div className="flex flex-col gap-3" aria-label={securityCopy.events.loading}>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

export function SecurityEventsList({
  events,
  error,
  isLoading,
}: {
  events: readonly SecurityEventSummary[]
  error?: Error | null
  isLoading?: boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const visibleEvents = isExpanded ? events : events.slice(0, 2)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="security-events-title">
      <div className="flex items-center justify-between gap-3">
        <h3
          id="security-events-title"
          className="text-sm font-medium text-muted-foreground"
        >
          {securityCopy.events.title}
        </h3>
        {events.length > 2 ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded
              ? securityCopy.events.showLess
              : securityCopy.events.viewAll(events.length)}
          </Button>
        ) : null}
      </div>

      {isLoading ? <EventSkeletons /> : null}
      {!isLoading && error ? (
        <p className="text-sm text-muted-foreground">{securityCopy.events.error}</p>
      ) : null}
      {!isLoading && !error && events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {securityCopy.events.emptyDescription}
        </p>
      ) : null}
      {!isLoading && !error && events.length > 0 ? (
        <ItemGroup className="gap-5!" data-security-list="events">
          {visibleEvents.map((event) => {
            return (
              <Item key={event.id} variant="default" size="xs" className="px-0">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    event.tone === "warning" ? "bg-warning" : "bg-success"
                  )}
                  aria-hidden="true"
                />
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-none">{event.title}</ItemTitle>
                  <p className="truncate text-xs text-muted-foreground">
                    {event.description}
                  </p>
                </ItemContent>
                <ItemActions className="shrink-0 text-xs text-muted-foreground">
                  {formatEventDate(event.occurredAt)}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      ) : null}
    </section>
  )
}
