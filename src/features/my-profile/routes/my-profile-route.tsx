import { AlertTriangleIcon, KeyRoundIcon } from "lucide-react"
import * as React from "react"

import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { SecurityChangePasswordDialog } from "@/features/security/components/security-change-password-dialog"
import { useSecurityPasswordChange } from "@/features/security/hooks/use-security-password-change"

import { getProfileInitials, ProfileFormCard, ProfilePhotoDialog } from "../components"
import { useMyProfile } from "../hooks/use-my-profile"
import { myProfileCopy } from "../my-profile-copy"

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-64 flex-1 items-center justify-center rounded-lg border bg-background p-6 text-foreground">
      {children}
    </section>
  )
}

export function MyProfileRoute() {
  const { error, isLoading, profile, refreshProfile, saveProfile, uploadAvatarFile } = useMyProfile()
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isSavingPhoto, setIsSavingPhoto] = React.useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = React.useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false)
  const { changePassword, isChangingPassword } = useSecurityPasswordChange()

  async function handleChangePassword(input: { currentPassword: string; newPassword: string }) {
    await changePassword(input)
    setIsPasswordDialogOpen(false)
  }

  async function handleSaveProfile(input: Parameters<typeof saveProfile>[0]) {
    if (isSavingProfile) {
      return
    }

    setIsSavingProfile(true)

    try {
      await notify.track(saveProfile(input), myProfileCopy.feedback.profile)
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleSavePhotoFile(payload: {
    file?: File
    imageUrl?: string
    previewUrl: string
  }) {
    if (!profile || isSavingPhoto) {
      return
    }

    setIsSavingPhoto(true)

    try {
      await notify.track((async () => {
        const avatarPath = payload.file
          ? await uploadAvatarFile(payload.file)
          : null

        await saveProfile({
          avatarPath,
          avatarPreviewUrl: payload.imageUrl ?? payload.previewUrl,
          email: profile.email,
          name: profile.name,
        })
      })(), myProfileCopy.feedback.profile)
      setIsPhotoDialogOpen(false)
    } finally {
      setIsSavingPhoto(false)
    }
  }

  if (isLoading) {
    return (
      <PageSection>
        <PageHeader title={myProfileCopy.page.title} subtitle={myProfileCopy.page.subtitle} />
        <CenteredState>
          <Spinner className="size-6 text-primary" aria-label={myProfileCopy.page.title} />
        </CenteredState>
      </PageSection>
    )
  }

  if (error && !profile) {
    return (
      <PageSection>
        <PageHeader title={myProfileCopy.page.title} subtitle={myProfileCopy.page.subtitle} />
        <CenteredState>
          <AppEmptyState
            media={<AlertTriangleIcon />}
            title={myProfileCopy.error.title}
            description={myProfileCopy.empty.description}
            actions={
              <Button type="button" variant="secondary" size="lg" onClick={() => { void refreshProfile() }}>
                {myProfileCopy.error.action}
              </Button>
            }
          />
        </CenteredState>
      </PageSection>
    )
  }

  if (!profile) {
    return (
      <PageSection>
        <PageHeader title={myProfileCopy.page.title} subtitle={myProfileCopy.page.subtitle} />
        <CenteredState>
          <AppEmptyState
            title={myProfileCopy.empty.title}
            description={myProfileCopy.empty.description}
            actions={
              <Button type="button" variant="secondary" size="lg" onClick={() => { void refreshProfile() }}>
                {myProfileCopy.empty.action}
              </Button>
            }
          />
        </CenteredState>
      </PageSection>
    )
  }

  return (
    <PageSection className="w-full pb-6">
      <PageHeader
        title={myProfileCopy.page.title}
        subtitle={myProfileCopy.page.subtitle}
        actions={(
          <PageHeaderActions>
            <Button type="button" variant="secondary" size="lg" onClick={() => setIsPasswordDialogOpen(true)}>
              <KeyRoundIcon aria-hidden="true" />
              {myProfileCopy.changePassword.action}
            </Button>
          </PageHeaderActions>
        )}
      />

      <div className="grid gap-4">
        {error ? (
          <Alert className="border-destructive/30 bg-destructive/5 text-foreground">
            <AlertTriangleIcon className="text-destructive" aria-hidden="true" />
            <AlertTitle>{myProfileCopy.error.noticeTitle}</AlertTitle>
            <AlertDescription>{myProfileCopy.feedback.profile.error}</AlertDescription>
          </Alert>
        ) : null}

        <ProfileFormCard
          key={[profile.id, profile.name, profile.email ?? "", profile.phoneMasked ?? "", profile.avatarPath ?? "", profile.avatarUrl ?? ""].join(":")}
          profile={profile}
          isSaving={isSavingProfile}
          onSave={handleSaveProfile}
          onOpenPhotoDialog={() => setIsPhotoDialogOpen(true)}
        />
      </div>

      {isPhotoDialogOpen ? (
        <ProfilePhotoDialog
          avatarUrl={profile.avatarUrl}
          fallback={getProfileInitials(profile.name)}
          isSaving={isSavingPhoto}
          onOpenChange={setIsPhotoDialogOpen}
          onSaveFile={handleSavePhotoFile}
          open={isPhotoDialogOpen}
        />
      ) : null}

      <SecurityChangePasswordDialog
        open={isPasswordDialogOpen}
        isSaving={isChangingPassword}
        onOpenChange={setIsPasswordDialogOpen}
        onSubmit={handleChangePassword}
      />
    </PageSection>
  )
}

export default MyProfileRoute
