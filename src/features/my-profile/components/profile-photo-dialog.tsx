import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib"

import { myProfileCopy } from "../my-profile-copy"
import { validateAvatarFile } from "../services"

export interface ProfilePhotoDialogProps {
  avatarUrl: string | null
  fallback: string
  isSaving?: boolean
  onSaveFile: (payload: { file: File; previewUrl: string }) => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}

function createObjectPreviewUrl(file: File) {
  return URL.createObjectURL(file)
}

export function getProfileInitials(name: string | null | undefined) {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  )
}

export function ProfilePhotoDialog({
  avatarUrl,
  fallback,
  isSaving = false,
  onSaveFile,
  onOpenChange,
  open,
}: ProfilePhotoDialogProps) {
  const fileInputId = React.useId()
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const previewUrl = selectedPreviewUrl ?? avatarUrl

  React.useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl)
      }
    }
  }, [selectedPreviewUrl])

  function openFilePicker() {
    if (!isSaving) {
      document.getElementById(fileInputId)?.click()
    }
  }

  function selectFile(file: File) {
    if (isSaving) {
      return
    }

    try {
      validateAvatarFile(file)
      const nextPreviewUrl = createObjectPreviewUrl(file)

      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl)
      }

      setSelectedFile(file)
      setSelectedPreviewUrl(nextPreviewUrl)
      setError(null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : myProfileCopy.feedback.profile.error)
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      selectFile(file)
    }
  }

  async function handleSaveFile() {
    if (isSaving) {
      return
    }

    if (!selectedFile || !selectedPreviewUrl) {
      setError(myProfileCopy.photoDialog.required)
      return
    }

    await onSaveFile({ file: selectedFile, previewUrl: selectedPreviewUrl })
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={myProfileCopy.photoDialog.title}
      description={myProfileCopy.photoDialog.description}
      className="sm:max-w-md"
      contentProps={{ showCloseButton: false }}
      bodyClassName="grid gap-4"
      footerClassName="grid grid-cols-1 gap-2 sm:grid-cols-2"
      footer={(
        <>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {myProfileCopy.photoDialog.cancel}
          </Button>
          <Button type="button" size="lg" className="w-full" disabled={isSaving} onClick={() => { void handleSaveFile() }}>
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {isSaving ? myProfileCopy.photoDialog.saving : myProfileCopy.photoDialog.save}
          </Button>
        </>
      )}
    >
      <button
        type="button"
        className={cn(
          "grid w-full justify-items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center transition-colors hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          isSaving && "pointer-events-none opacity-60"
        )}
        aria-disabled={isSaving || undefined}
        onClick={openFilePicker}
      >
        <Avatar className="size-28 text-2xl">
          {previewUrl ? <AvatarImage src={previewUrl} alt="" /> : null}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <span className="grid max-w-xs gap-1">
          <span className="text-sm font-medium text-foreground">{myProfileCopy.photoDialog.previewTitle}</span>
          <span className="text-xs text-muted-foreground">{myProfileCopy.photoDialog.dropDescription}</span>
          {selectedFile ? (
            <span className="break-all text-xs text-muted-foreground">{selectedFile.name}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{myProfileCopy.photoDialog.selectFile}</span>
          )}
        </span>
      </button>

      <Input
        id={fileInputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={isSaving}
        onChange={(event) => {
          handleFileChange(event)
          event.target.value = ""
        }}
      />

      {error ? <FieldError>{error}</FieldError> : null}
    </AppDialog>
  )
}
