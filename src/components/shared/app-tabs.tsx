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
      <TabsList variant="line" className="w-full justify-start rounded-xl border border-border/50 bg-secondary/60 p-1 shadow-sm">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-0 rounded-2xl border border-border/50 bg-secondary/40 p-4 sm:p-5">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
