import { ImageIcon, ImageUpIcon, LinkIcon, UploadCloudIcon } from "lucide-react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { settingsCopy } from "../settings-copy"
import {
  SettingsProfileError,
  validateAvatarFile,
  validateAvatarUrl,
} from "../services/settings-profile-service"

export interface ProfilePhotoDialogProps {
  avatarUrl: string | null
  fallback: string
  isSaving?: boolean
  onSaveFile: (file: File, previewUrl: string) => Promise<void>
  onSaveUrl: (url: string | null) => Promise<void>
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
  onSaveUrl,
  onOpenChange,
  open,
}: ProfilePhotoDialogProps) {
  const fileInputId = React.useId()
  const [activeTab, setActiveTab] = React.useState("upload")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = React.useState<string | null>(null)
  const [urlValue, setUrlValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl)
      }
    }
  }, [selectedPreviewUrl])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    selectFile(file)
  }

  async function handleSaveFile() {
    if (!selectedFile || !selectedPreviewUrl) {
      setError("Selecione uma imagem para continuar.")
      return
    }

    await onSaveFile(selectedFile, selectedPreviewUrl)
  }

  async function handleSaveUrl() {
    try {
      await onSaveUrl(validateAvatarUrl(urlValue))
    } catch (caughtError) {
      setError(
        caughtError instanceof SettingsProfileError
          ? caughtError.message
          : settingsCopy.feedback.profile.error
      )
    }
  }

  const isUploadTab = activeTab === "upload"
  const urlPreviewUrl = React.useMemo(() => {
    try {
      return validateAvatarUrl(urlValue) ?? avatarUrl
    } catch {
      return avatarUrl
    }
  }, [avatarUrl, urlValue])
  const previewUrl = isUploadTab
    ? selectedPreviewUrl || avatarUrl
    : urlPreviewUrl

  function selectFile(file: File) {
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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : settingsCopy.feedback.profile.error
      )
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={settingsCopy.photoDialog.title}
      description={settingsCopy.photoDialog.description}
      className="sm:max-w-md"
      bodyClassName="max-h-[70vh]"
      footerClassName="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:justify-stretch"
      contentProps={{ showCloseButton: false }}
      footer={(
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {settingsCopy.photoDialog.cancel}
          </Button>
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={isSaving}
            onClick={() => {
              void (activeTab === "upload" ? handleSaveFile() : handleSaveUrl())
            }}
          >
            {isSaving
              ? settingsCopy.photoDialog.saving
              : settingsCopy.photoDialog.save}
          </Button>
        </>
      )}
    >
      <div className="grid gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="upload">
              <UploadCloudIcon aria-hidden="true" />
              {settingsCopy.photoDialog.uploadTab}
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon aria-hidden="true" />
              {settingsCopy.photoDialog.urlTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="pt-3">
            <Field>
              <FieldLabel
                htmlFor={fileInputId}
                className="grid cursor-pointer gap-3 rounded-lg border border-dashed p-3 text-center"
                onDragOver={(event) => {
                  event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const file = event.dataTransfer.files[0]

                  if (file) {
                    selectFile(file)
                  }
                }}
              >
                <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-10 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>
                <span className="grid gap-1">
                  <span className="inline-flex items-center justify-center gap-2 text-sm font-medium">
                    <ImageUpIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    {settingsCopy.photoDialog.dropTitle}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {settingsCopy.photoDialog.dropDescription}
                  </span>
                  <span className="mx-auto mt-1 inline-flex h-9 items-center rounded-lg border px-3 text-sm">
                    {settingsCopy.photoDialog.browse}
                  </span>
                </span>
              </FieldLabel>
              <Input
                id={fileInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  handleFileChange(event)
                  event.target.value = ""
                }}
              />
            </Field>
          </TabsContent>

          <TabsContent value="url" className="pt-3">
            <Field>
              <FieldLabel htmlFor="profile-photo-url">
                {settingsCopy.photoDialog.urlLabel}
              </FieldLabel>
              <Input
                id="profile-photo-url"
                value={urlValue}
                onChange={(event) => {
                  setUrlValue(event.target.value)
                  setSelectedFile(null)
                  if (selectedPreviewUrl) {
                    URL.revokeObjectURL(selectedPreviewUrl)
                  }
                  setSelectedPreviewUrl(null)
                }}
                placeholder={settingsCopy.photoDialog.urlPlaceholder}
                inputMode="url"
              />
              <FieldDescription>
                {settingsCopy.photoDialog.description}
              </FieldDescription>
            </Field>
            <div className="mt-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
              {previewUrl && !isUploadTab ? (
                <img src={previewUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-10 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </AppDialog>
  )
}
