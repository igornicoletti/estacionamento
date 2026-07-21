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
      <TabsList className="h-10 w-full max-w-full justify-start overflow-x-auto rounded-lg p-1">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="h-8 min-w-28 flex-1 rounded-md px-3 text-sm data-active:bg-background data-[state=active]:bg-background data-active:text-foreground data-[state=active]:text-foreground data-active:shadow-sm data-[state=active]:shadow-sm"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-0 min-w-0 px-px pb-px">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
