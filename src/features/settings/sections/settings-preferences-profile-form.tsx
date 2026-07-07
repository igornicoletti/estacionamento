import { ImageUpIcon, SaveIcon, UserIcon } from "lucide-react"
import * as React from "react"

import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { formatPhone, onlyDigits } from "@/lib"

import { settingsCopy } from "../settings-copy"
import { type SettingsProfile } from "../types/settings-types"

const FIELD_WIDTH_CLASS = "h-9 w-full lg:w-80"
const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024

function AvatarUploadZone() {
  const [preview, setPreview] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const previousUrlRef = React.useRef<string | null>(null)

  function revokePreview() {
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current)
      previousUrlRef.current = null
    }
  }

  function applyFile(file: File | undefined) {
    if (!file) {
      return
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      setError(settingsCopy.profile.avatar.invalidFormat)
      return
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError(settingsCopy.profile.avatar.tooLarge)
      return
    }

    setError(null)
    revokePreview()
    const url = URL.createObjectURL(file)
    previousUrlRef.current = url
    setPreview(url)
  }

  function handleClick() {
    inputRef.current?.click()
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0])
    event.target.value = ""
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    applyFile(event.dataTransfer.files?.[0])
  }

  function handleRemove(event: React.MouseEvent) {
    event.stopPropagation()
    revokePreview()
    setPreview(null)
    setError(null)
  }

  React.useEffect(() => {
    return () => {
      revokePreview()
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-2">
      <Empty
        role="button"
        tabIndex={0}
        aria-label={settingsCopy.profile.avatar.dropzoneLabel}
        data-dragging={isDragging ? "" : undefined}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleClick()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => {
          setIsDragging(false)
        }}
        onDrop={handleDrop}
        className="cursor-pointer border border-dashed p-4 transition-colors hover:bg-muted/50 data-[dragging]:border-primary data-[dragging]:bg-muted/50"
      >
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageUpIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{settingsCopy.profile.avatar.title}</EmptyTitle>
          <EmptyDescription>
            {settingsCopy.profile.avatar.description}
            <br />
            {settingsCopy.profile.avatar.allowedFormats} · {settingsCopy.profile.avatar.maxSize}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}

      {preview ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={handleRemove}
        >
          {settingsCopy.profile.avatar.removeButton}
        </Button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </div>
  )
}

interface ProfileFieldDefinition {
  id: string
  key: keyof SettingsProfile
  label: string
  description: string
  helper?: string
  placeholder: string
  type?: React.ComponentProps<typeof Input>["type"]
  inputMode?: React.ComponentProps<typeof Input>["inputMode"]
  normalize?: (value: string) => string
  readOnly?: boolean
}

const profileFields: readonly ProfileFieldDefinition[] = [
  {
    id: "settings-name",
    key: "name",
    label: settingsCopy.profile.fields.name.label,
    description: settingsCopy.profile.fields.name.description,
    helper: settingsCopy.profile.fields.name.helper,
    placeholder: settingsCopy.profile.fields.name.placeholder,
    readOnly: true,
  },
  {
    id: "settings-cpf",
    key: "cpf",
    label: settingsCopy.profile.fields.cpf.label,
    description: settingsCopy.profile.fields.cpf.description,
    helper: settingsCopy.profile.fields.cpf.helper,
    placeholder: settingsCopy.profile.fields.cpf.placeholder,
    readOnly: true,
  },
  {
    id: "settings-phone",
    key: "phone",
    label: settingsCopy.profile.fields.phone.label,
    description: settingsCopy.profile.fields.phone.description,
    helper: settingsCopy.profile.fields.phone.helper,
    placeholder: settingsCopy.profile.fields.phone.placeholder,
    inputMode: "tel",
    normalize: (value) => formatPhone(onlyDigits(value)),
  },
  {
    id: "settings-email",
    key: "email",
    label: settingsCopy.profile.fields.email.label,
    description: settingsCopy.profile.fields.email.description,
    helper: settingsCopy.profile.fields.email.helper,
    placeholder: settingsCopy.profile.fields.email.placeholder,
    type: "email",
    readOnly: true,
  },
]

interface SettingsPreferencesProfileFormProps {
  profile: SettingsProfile
  isSaving: boolean
  onSave: (profile: SettingsProfile) => Promise<void>
}

export function SettingsPreferencesProfileForm({
  profile,
  isSaving,
  onSave,
}: SettingsPreferencesProfileFormProps) {
  const [form, setForm] = React.useState<SettingsProfile>(profile)

  function handleChange(field: keyof SettingsProfile, value: string) {
    setForm((state) => ({ ...state, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    try {
      await notify.track(onSave(form), {
        loading: settingsCopy.profile.saveFeedback.loading,
        success: settingsCopy.profile.saveFeedback.success,
        error: (error) =>
          error instanceof Error
            ? error.message
            : settingsCopy.profile.saveFeedback.error,
      })
    } catch {
      // Error feedback already surfaced via notify.track above.
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-lg border">
        <form onSubmit={(event) => {
          void handleSubmit(event)
        }}>
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <UserIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium">
              {settingsCopy.profile.sectionTitle}
            </span>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {settingsCopy.profile.sectionDescription}
            </p>

            <AvatarUploadZone />

            <div className="flex flex-col gap-3">
              {profileFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-md border border-border/50 px-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                    {field.helper ? (
                      <p className="text-xs text-muted-foreground/70 italic">{field.helper}</p>
                    ) : null}
                  </div>
                  <div className="lg:ml-auto">
                    <Input
                      id={field.id}
                      type={field.type}
                      className={FIELD_WIDTH_CLASS}
                      placeholder={field.placeholder}
                      inputMode={field.inputMode}
                      value={form[field.key]}
                      onChange={(event) => {
                        const rawValue = event.target.value
                        const nextValue = field.normalize
                          ? field.normalize(rawValue)
                          : rawValue

                        handleChange(field.key, nextValue)
                      }}
                      readOnly={field.readOnly}
                      disabled={isSaving || field.readOnly}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t px-4 py-3">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={isSaving}
            >
              <SaveIcon aria-hidden="true" />
              {settingsCopy.profile.saveButton}
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
