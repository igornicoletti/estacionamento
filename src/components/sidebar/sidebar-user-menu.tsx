import {
  BellIcon,
  LogOutIcon,
  UserIcon,
  UserRoundIcon,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { shouldBypassAuthInDev } from "@/config"
import {
  isUserRole,
  userRoleLabels,
} from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"
import { useUsers } from "@/features/users"
import { type UserRecord } from "@/features/users/types/users-types"

import { sidebarCopy } from "./sidebar-copy"

type UnknownRecord = Record<PropertyKey, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

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

function getProfileName(profile: unknown) {
  if (!isRecord(profile) || typeof profile.name !== "string") {
    return "Usuário"
  }

  return profile.name.trim() || "Usuário"
}

function getProfileMeta(profile: unknown) {
  if (!isRecord(profile)) {
    return shouldBypassAuthInDev()
      ? sidebarCopy.profile.developmentMode
      : sidebarCopy.profile.fallbackRole
  }

  return isUserRole(profile.role)
    ? userRoleLabels[profile.role]
    : sidebarCopy.profile.fallbackRole
}

function resolveSessionUser(profile: unknown, users: readonly UserRecord[]) {
  if (!users.length) {
    return null
  }

  if (isRecord(profile)) {
    const profileId = typeof profile.id === "string" ? profile.id : null
    const profileEmail = typeof profile.email === "string"
      ? profile.email.toLowerCase()
      : null

    const matchedById = profileId
      ? users.find((user) => user.id === profileId)
      : null

    if (matchedById) {
      return matchedById
    }

    const matchedByEmail = profileEmail
      ? users.find((user) => user.email?.toLowerCase() === profileEmail)
      : null

    if (matchedByEmail) {
      return matchedByEmail
    }
  }

  return users.find((user) => user.status === "active") ?? users[0] ?? null
}

export function UserMenu() {
  const { profile, signOut } = useAuthSession()
  const { data: users } = useUsers()
  const navigate = useNavigate()
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const sessionUser = resolveSessionUser(profile, users)
  const displayName = sessionUser?.name || getProfileName(profile)
  const profileMeta = isRecord(profile) && isUserRole(profile.role)
    ? userRoleLabels[profile.role]
    : null
  const displayMeta = profileMeta ?? (sessionUser
    ? userRoleLabels[sessionUser.role]
    : getProfileMeta(profile))
  const fallback = getFallback(displayName)

  async function handleSignOut() {
    await signOut()
    void navigate("/login", { replace: true })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 gap-2 px-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${displayName} - abrir menu de usuário`}
          >
            <Avatar>
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-center md:flex">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">{displayMeta}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-2rem)] sm:w-64"
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
              <Link to="/perfil">
                <UserRoundIcon />
                {sidebarCopy.menu.myProfile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <UserIcon />
                {sidebarCopy.menu.settings}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notificacoes">
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

      <DestructiveConfirmDialog
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        title={sidebarCopy.dialog.signOutTitle}
        description={sidebarCopy.dialog.signOutDescription}
        confirmLabel={sidebarCopy.dialog.signOutConfirm}
        onConfirm={async () => {
          await handleSignOut()
        }}
      />
    </>
  )
}
