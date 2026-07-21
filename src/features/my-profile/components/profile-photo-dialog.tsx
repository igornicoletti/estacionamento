import { ImageUpIcon, LinkIcon } from "lucide-react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { myProfileCopy } from "../my-profile-copy"
import { validateAvatarFile, validateAvatarImageUrl } from "../services"

export interface ProfilePhotoDialogProps {
  avatarUrl: string | null
  fallback: string
  isSaving?: boolean
  onSaveFile: (payload: { file?: File; imageUrl?: string; previewUrl: string }) => Promise<void>
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
  isSaving = false,
  onSaveFile,
  onOpenChange,
  open,
}: ProfilePhotoDialogProps) {
  const fileInputId = React.useId()
  const imageUrlInputId = React.useId()
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = React.useState<string | null>(null)
  const [imageUrl, setImageUrl] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const previewUrl = selectedPreviewUrl

  void avatarUrl

  React.useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl)
      }
    }
  }, [selectedPreviewUrl])

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
      setImageUrl("")
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

    if (!selectedFile) {
      try {
        const safeImageUrl = validateAvatarImageUrl(imageUrl)
        await onSaveFile({ imageUrl: safeImageUrl, previewUrl: safeImageUrl })
        return
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : myProfileCopy.photoDialog.invalidUrl)
        return
      }
    }

    if (!selectedPreviewUrl) {
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
      contentProps={{ showCloseButton: false }}
      bodyClassName="flex flex-col gap-4"
      footerClassName="grid grid-cols-2 gap-2"
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
      <Tabs defaultValue="upload" className="flex flex-col gap-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="upload">
            <ImageUpIcon className="size-4" />
            Upload de imagem
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="size-4" />
            URL de imagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          {previewUrl ? (
            <div className="flex flex-col items-center gap-4">
              <span className="flex size-28 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted/20">
                <img src={previewUrl} alt="" className="size-full object-cover" />
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={() => {
                  if (!isSaving) {
                    document.getElementById(fileInputId)?.click()
                  }
                }}
              >
                Trocar imagem
              </Button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={isSaving ? -1 : 0}
              aria-disabled={isSaving || undefined}
              className="w-full rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-left transition-colors hover:bg-muted/30"
              onClick={() => {
                if (!isSaving) {
                  document.getElementById(fileInputId)?.click()
                }
              }}
              onKeyDown={(event) => {
                if (isSaving) {
                  return
                }

                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  document.getElementById(fileInputId)?.click()
                }
              }}
            >
              <AppEmptyState
                media={<ImageUpIcon aria-hidden="true" />}
                title={myProfileCopy.photoDialog.dropTitle}
                description={myProfileCopy.photoDialog.dropDescription}
                actions={
                  <Button type="button" variant="secondary" size="lg" disabled={isSaving}>
                    {myProfileCopy.profile.avatarAction}
                  </Button>
                }
              />
            </div>
          )}

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
        </TabsContent>

        <TabsContent value="url" className="mt-0">
          <Field className="w-full">
            <FieldLabel htmlFor={imageUrlInputId}>
              {myProfileCopy.photoDialog.imageUrl}
            </FieldLabel>
            <Input
              id={imageUrlInputId}
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value)
                setSelectedFile(null)
                if (selectedPreviewUrl) {
                  URL.revokeObjectURL(selectedPreviewUrl)
                }
                setSelectedPreviewUrl(null)
                setError(null)
              }}
              placeholder={myProfileCopy.photoDialog.imageUrlPlaceholder}
              disabled={isSaving}
            />
          </Field>
        </TabsContent>
      </Tabs>

      {error ? <FieldError>{error}</FieldError> : null}
    </AppDialog>
  )
}
