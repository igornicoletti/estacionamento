import { LinkIcon, UploadCloudIcon } from "lucide-react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { AppEmptyState } from '@/components/shared'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  SettingsProfileError,
  validateAvatarFile,
  validateAvatarUrl,
} from "../services/settings-profile-service"
import { settingsCopy } from "../settings-copy"

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
      contentProps={{ showCloseButton: false }}
      bodyClassName="flex flex-col gap-4"
      footerClassName="grid grid-cols-2 gap-2"
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
      <div className="flex w-full gap-2 rounded-lg bg-muted p-1">
        <button
          type="button"
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            activeTab === "upload"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("upload")}
        >
          <UploadCloudIcon className="size-4" aria-hidden="true" />
          {settingsCopy.photoDialog.uploadTab}
        </button>
        <button
          type="button"
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            activeTab === "url"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("url")}
        >
          <LinkIcon className="size-4" aria-hidden="true" />
          {settingsCopy.photoDialog.urlTab}
        </button>
      </div>

      {activeTab === "upload" ? (
        <Field>
          <FieldLabel
            htmlFor={fileInputId}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
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
            {previewUrl && isUploadTab ? (
              <span className="flex w-full max-w-xs items-center justify-center overflow-hidden rounded-md">
                <img
                  src={previewUrl}
                  alt=""
                  className="max-h-48 w-auto rounded-md object-contain"
                />
              </span>
            ) : (
              <AppEmptyState
                media={<UploadCloudIcon aria-hidden="true" />}
                title={settingsCopy.photoDialog.dropTitle}
                description={settingsCopy.photoDialog.dropDescription}
                actions={
                  <span className="text-sm font-medium text-primary">
                    {settingsCopy.photoDialog.browse}
                  </span>
                }
              />
            )}
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
      ) : (
        <Field>
          <InputGroup>
            <InputGroupInput
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
              type="url"
            />
            <InputGroupAddon align="inline-start">
              <LinkIcon aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
      )}

      {error ? <FieldError>{error}</FieldError> : null}
    </AppDialog>
  )
}
