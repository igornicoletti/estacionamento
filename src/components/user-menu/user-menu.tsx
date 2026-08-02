import * as React from "react"
import { Link, useNavigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { notify } from "@/components/toast"
import { shouldBypassAuthInDev } from "@/config"
import { useAuthSession } from "@/features/auth/hooks"
import { ProfilePhotoDialog } from "@/features/my-profile/components"
import {
  updateCurrentProfile,
  uploadProfileAvatarFile,
} from "@/features/my-profile/services/profile-service"

import { userMenuCopy } from "./user-menu-copy"
import { createUserMenuProfile } from "./user-menu-profile"
import type { SignOutConfirmationCopy } from "./user-menu.types"
import { scheduleAfterMenuClose } from "./user-menu-utils"
import { UserMenuView } from "./user-menu-view"

export type UserMenuControllerProps = {
  profile: unknown
  onRefresh: () => Promise<void>
  onSignOut: () => Promise<void>
  signOutCopy: SignOutConfirmationCopy
}

export function UserMenuController({
  profile,
  onRefresh,
  onSignOut,
  signOutCopy,
}: UserMenuControllerProps) {
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = React.useState(false)
  const [isSavingPhoto, setIsSavingPhoto] = React.useState(false)
  const isSavingPhotoRef = React.useRef(false)
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = React.useState(false)

  const profileView = React.useMemo(
    () =>
      createUserMenuProfile(profile, {
        fallbackName: userMenuCopy.fallbackName,
        fallbackMeta: shouldBypassAuthInDev()
          ? userMenuCopy.developmentMode
          : userMenuCopy.fallbackMeta,
      }),
    [profile]
  )

  const openPhotoDialog = React.useCallback(() => {
    scheduleAfterMenuClose(() => setIsPhotoDialogOpen(true))
  }, [])

  const openSignOutDialog = React.useCallback(() => {
    scheduleAfterMenuClose(() => setIsSignOutDialogOpen(true))
  }, [])

  const handleSavePhotoFile = React.useCallback(
    async (payload: { file: File; previewUrl: string }) => {
      if (!profileView.authUserId || isSavingPhotoRef.current) {
        return
      }

      isSavingPhotoRef.current = true
      setIsSavingPhoto(true)

      try {
        const avatarPath = await uploadProfileAvatarFile(
          payload.file,
          profileView.authUserId
        )

        await updateCurrentProfile({
          avatarPath,
          avatarPreviewUrl: payload.previewUrl,
          email: profileView.email,
          name: profileView.displayName,
        })
        await onRefresh()
        setIsPhotoDialogOpen(false)
      } catch {
        notify.error(userMenuCopy.avatarUpdateError)
      } finally {
        isSavingPhotoRef.current = false
        setIsSavingPhoto(false)
      }
    },
    [onRefresh, profileView]
  )

  return (
    <>
      <UserMenuView
        profile={profileView}
        labels={userMenuCopy.labels}
        changePhotoDisabled={!profileView.authUserId || isSavingPhoto}
        onChangePhoto={openPhotoDialog}
        onSignOutMobile={openSignOutDialog}
        signOutLabel={signOutCopy.actionLabel}
        renderProfileLink={(children) => (
          <Link to={appRoutePaths.profile}>{children}</Link>
        )}
      />

      {isPhotoDialogOpen ? (
        <ProfilePhotoDialog
          avatarUrl={profileView.avatarUrl}
          fallback={profileView.fallback}
          isSaving={isSavingPhoto}
          open={isPhotoDialogOpen}
          onOpenChange={setIsPhotoDialogOpen}
          onSaveFile={handleSavePhotoFile}
        />
      ) : null}

      <AppAlertDialog
        size="sm"
        tone="destructive"
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        title={signOutCopy.title}
        description={signOutCopy.description}
        actionLabel={signOutCopy.actionLabel}
        pendingLabel={signOutCopy.pendingLabel}
        onAction={onSignOut}
      />
    </>
  )
}

export type UserMenuProps = {
  signOutCopy?: SignOutConfirmationCopy
}

export function UserMenu({
  signOutCopy = userMenuCopy.signOut,
}: UserMenuProps = {}) {
  const { profile, refresh, signOut } = useAuthSession()
  const navigate = useNavigate()

  const handleSignOut = React.useCallback(async () => {
    await signOut()
    void navigate(appRoutePaths.login, { replace: true })
  }, [navigate, signOut])

  return (
    <UserMenuController
      profile={profile}
      onRefresh={refresh}
      onSignOut={handleSignOut}
      signOutCopy={signOutCopy}
    />
  )
}
