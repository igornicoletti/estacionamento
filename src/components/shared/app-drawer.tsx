"use client"

import * as React from "react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

function isRenderable(value: React.ReactNode) {
  return value !== null && value !== undefined && typeof value !== "boolean"
}

type DrawerRootProps = React.ComponentProps<typeof Drawer>

type DrawerOpenProps = Pick<
  DrawerRootProps,
  "open" | "defaultOpen" | "onOpenChange"
>

export type AppDrawerProps = DrawerOpenProps & {
  trigger?: React.ReactElement
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  drawerProps?: DrawerRootProps
  contentProps?: Omit<
    React.ComponentProps<typeof DrawerContent>,
    "children" | "className"
  >
}

export function AppDrawer({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
  drawerProps,
  contentProps,
}: AppDrawerProps) {
  const hasHeader = isRenderable(title) || isRenderable(description)
  const controlledProps: DrawerOpenProps = {
    open,
    defaultOpen,
    onOpenChange,
  }

  return (
    <Drawer {...drawerProps} {...controlledProps}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}

      <DrawerContent {...contentProps} className={cn(className)}>
        {hasHeader ? (
          <DrawerHeader>
            {isRenderable(title) ? <DrawerTitle>{title}</DrawerTitle> : null}

            {isRenderable(description) ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
        ) : null}

        {children}

        {isRenderable(footer) ? <DrawerFooter>{footer}</DrawerFooter> : null}
      </DrawerContent>
    </Drawer>
  )
}
