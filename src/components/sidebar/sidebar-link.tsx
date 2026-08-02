"use client"

import * as React from "react"

import type {
  SidebarLinkRenderProps,
  SidebarLinkTarget,
} from "./sidebar.types"

type RenderSidebarLinkOptions = {
  target: SidebarLinkTarget
  children: React.ReactNode
  ariaLabel: string
  onClick: React.MouseEventHandler<HTMLAnchorElement>
}

export function renderSidebarLink({
  target,
  children,
  ariaLabel,
  onClick,
}: RenderSidebarLinkOptions) {
  const linkProps: SidebarLinkRenderProps = {
    children,
    onClick,
    "aria-label": ariaLabel,
  }

  return target.renderLink(linkProps)
}
