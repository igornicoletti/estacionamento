"use client"

import * as React from "react"

import { AppDialog, type AppDialogProps } from "@/components/shared/app-dialog"
import { AppDrawer, type AppDrawerProps } from "@/components/shared/app-drawer"
import { useControllableOpen } from "@/hooks/use-controllable-open"
import { useMediaQuery } from "@/hooks/use-media-query"

export type AppResponsiveDialogDrawerProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  desktopQuery?: string
  defaultDesktop?: boolean
  dialogProps?: Omit<
    AppDialogProps,
    | "open"
    | "defaultOpen"
    | "onOpenChange"
    | "trigger"
    | "title"
    | "description"
    | "children"
    | "footer"
    | "className"
  >
  drawerProps?: Omit<
    AppDrawerProps,
    | "open"
    | "defaultOpen"
    | "onOpenChange"
    | "trigger"
    | "title"
    | "description"
    | "children"
    | "footer"
    | "className"
  >
}

export function AppResponsiveDialogDrawer({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
  desktopQuery = "(min-width: 768px)",
  defaultDesktop = false,
  dialogProps,
  drawerProps,
}: AppResponsiveDialogDrawerProps) {
  const isDesktop = useMediaQuery(desktopQuery, defaultDesktop)
  const [currentOpen, setCurrentOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  })

  if (isDesktop) {
    return (
      <AppDialog
        open={currentOpen}
        onOpenChange={setCurrentOpen}
        trigger={trigger}
        title={title}
        description={description}
        footer={footer}
        className={className}
        {...dialogProps}
      >
        {children}
      </AppDialog>
    )
  }

  return (
    <AppDrawer
      open={currentOpen}
      onOpenChange={setCurrentOpen}
      trigger={trigger}
      title={title}
      description={description}
      footer={footer}
      className={className}
      {...drawerProps}
    >
      {children}
    </AppDrawer>
  )
}
