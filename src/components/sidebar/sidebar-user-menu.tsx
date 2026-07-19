import { BellIcon, ImageUpIcon, LogOutIcon, UserRoundIcon } from "lucide-react"
import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { notify } from "@/components/toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, type AuthProfile } from "@/features/auth"
import {
  getProfileInitials,
  ProfilePhotoDialog,
} from "@/features/my-profile/components/profile-photo-dialog"
import { myProfileCopy } from "@/features/my-profile/my-profile-copy"
import {
  updateCurrentProfile,
  uploadProfileAvatarFile,
} from "@/features/my-profile/services/profile-service"

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
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = React.useState(false)
  const [isSavingPhoto, setIsSavingPhoto] = React.useState(false)
  const displayName = getDisplayName(auth.profile)
  const displayMeta = getDisplayMeta(auth.profile)
  const fallback = getProfileInitials(displayName) || getFallback(displayName)

  async function saveAvatar(avatarPath: string | null, previewUrl: string) {
    if (!auth.profile) {
      return
    }

    await updateCurrentProfile({
      avatarPath,
      avatarPreviewUrl: previewUrl,
      email: auth.profile.email,
      name: auth.profile.name,
    })
    auth.actions.applyProfilePatch({
      avatarPath,
      avatarUrl: previewUrl,
    })
    setIsPhotoDialogOpen(false)
    await auth.actions.refreshProfile()
  }

  async function handleSaveFile(payload: { file?: File; imageUrl?: string; previewUrl: string }) {
    const profile = auth.profile

    if (!profile) {
      return
    }

    setIsSavingPhoto(true)

    try {
      await notify.track((async () => {
        const avatarPath = payload.file
          ? await uploadProfileAvatarFile(payload.file, profile.authUserId)
          : null
        await saveAvatar(avatarPath, payload.imageUrl ?? payload.previewUrl)
      })(), myProfileCopy.feedback.profile)
    } finally {
      setIsSavingPhoto(false)
    }
  }

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
              {auth.profile?.avatarUrl ? (
                <AvatarImage src={auth.profile.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-center text-center md:flex">
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
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={appRoutePaths.profile}>
                <UserRoundIcon />
                {sidebarCopy.menu.myProfile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setIsPhotoDialogOpen(true)
              }}
            >
              <ImageUpIcon />
              {sidebarCopy.menu.changePhoto}
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

      {isPhotoDialogOpen ? (
        <ProfilePhotoDialog
          avatarUrl={auth.profile?.avatarUrl ?? null}
          fallback={fallback}
          isSaving={isSavingPhoto}
          onOpenChange={setIsPhotoDialogOpen}
          onSaveFile={handleSaveFile}
          open={isPhotoDialogOpen}
        />
      ) : null}
    </>
  )
}
