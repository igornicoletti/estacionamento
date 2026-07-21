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
      <TabsList className="w-full justify-start">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
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
