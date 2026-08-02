"use client"

import * as React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"

import type { SidebarLayoutMetrics } from "./sidebar.types"

type SidebarLayoutStyle = React.CSSProperties & {
  "--app-header-height"?: string
  "--app-header-height-collapsed"?: string
}

export type SidebarLayoutProviderProps = Omit<
  React.ComponentProps<typeof SidebarProvider>,
  "style"
> &
  SidebarLayoutMetrics & {
    style?: React.CSSProperties
  }

export function SidebarLayoutProvider({
  headerHeight = "4rem",
  collapsedHeaderHeight = "3rem",
  style,
  ...props
}: SidebarLayoutProviderProps) {
  const layoutStyle: SidebarLayoutStyle = {
    ...style,
    "--app-header-height": headerHeight,
    "--app-header-height-collapsed": collapsedHeaderHeight,
  }

  return <SidebarProvider style={layoutStyle} {...props} />
}
