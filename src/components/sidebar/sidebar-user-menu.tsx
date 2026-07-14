import { BellIcon, LogOutIcon, UserIcon, UserRoundIcon } from "lucide-react"
import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AuthProfile } from "@/features/auth/api"
import { useAuth } from "@/features/auth"

import { sidebarCopy } from "./sidebar-copy"

function getFallback(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  )
}

function getDisplayName(profile: AuthProfile | null) {
  return profile?.name?.trim() || sidebarCopy.profile.fallbackName
}

function getDisplayMeta(profile: AuthProfile | null) {
  return profile?.role?.label ?? profile?.email ?? sidebarCopy.profile.fallbackRole
}

export function UserMenu() {
  const auth = useAuth()
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = React.useState(false)
  const displayName = getDisplayName(auth.profile)
  const displayMeta = getDisplayMeta(auth.profile)
  const fallback = getFallback(displayName)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-10 gap-2 px-2"
            aria-label={sidebarCopy.menu.openUserMenu(displayName)}
          >
            <Avatar>
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium leading-none">{displayName}</span>
              <span className="text-xs text-muted-foreground">{displayMeta}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          collisionPadding={8}
          className="w-64 max-w-[calc(100vw-1rem)]"
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="grid px-1 py-1.5 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {displayMeta}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={appRoutePaths.profile}>
                <UserRoundIcon />
                {sidebarCopy.menu.myProfile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={appRoutePaths.settings}>
                <UserIcon />
                {sidebarCopy.menu.settings}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={appRoutePaths.notifications}>
                <BellIcon />
                {sidebarCopy.menu.notifications}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault()
                setIsSignOutDialogOpen(true)
              }}
            >
              <LogOutIcon />
              {sidebarCopy.menu.signOut}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AppAlertDialog
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        title={sidebarCopy.dialog.signOutTitle}
        description={sidebarCopy.dialog.signOutDescription}
        cancelLabel={sidebarCopy.dialog.signOutCancel}
        actionLabel={sidebarCopy.dialog.signOutConfirm}
        onAction={auth.actions.logoutAsync}
      />
    </>
  )
}
