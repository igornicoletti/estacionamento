"use client"

import * as React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type AppTabsItem = {
  value: string
  label: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

export type AppTabsProps = Omit<React.ComponentProps<typeof Tabs>, "children"> & {
  items: readonly AppTabsItem[]
}

export function AppTabs({
  items,
  className,
  defaultValue,
  ...props
}: AppTabsProps) {
  const resolvedDefaultValue = defaultValue ?? items[0]?.value

  return (
    <Tabs defaultValue={resolvedDefaultValue} className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <TabsList className="h-9 w-full max-w-full justify-start overflow-x-auto rounded-lg p-1 sm:w-fit">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="h-7 flex-none rounded-md px-3 text-sm data-active:bg-background data-active:text-foreground data-active:shadow-sm"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-0">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
