import { CameraIcon, UserIcon } from "lucide-react"
import * as React from "react"

import { notify } from "@/components/toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCpf, formatPhone, onlyDigits } from "@/lib"

import { settingsCopy } from "../settings-copy"
import { type SettingsProfile } from "../types/settings-types"

const FIELD_WIDTH_CLASS = "w-full lg:w-80"

function getNameFallback(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  )
}

interface AvatarUploadProps {
  name: string
}

function AvatarUpload({ name }: AvatarUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const previousUrlRef = React.useRef<string | null>(null)

  function handleClick() {
    inputRef.current?.click()
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current)
    }

    const url = URL.createObjectURL(file)
    previousUrlRef.current = url
    setPreview(url)
  }

  React.useEffect(() => {
    return () => {
      if (!previousUrlRef.current) {
        return
      }

      URL.revokeObjectURL(previousUrlRef.current)
      previousUrlRef.current = null
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar className="size-16">
          {preview ? <AvatarImage src={preview} alt="Foto de perfil" /> : null}
          <AvatarFallback className="text-base">{getNameFallback(name)}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={handleClick}
          aria-label={settingsCopy.profile.avatarButtonLabel}
          className="absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/80"
        >
          <CameraIcon className="size-3" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={settingsCopy.profile.avatarInputLabel}
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground">{settingsCopy.profile.avatarActionLabel}</p>
    </div>
  )
}

interface ProfileFieldDefinition {
  id: string
  key: keyof SettingsProfile
  label: string
  description: string
  placeholder: string
  type?: React.ComponentProps<typeof Input>["type"]
  inputMode?: React.ComponentProps<typeof Input>["inputMode"]
  normalize?: (value: string) => string
}

const profileFields: readonly ProfileFieldDefinition[] = [
  {
    id: "settings-name",
    key: "name",
    label: settingsCopy.profile.fields.name.label,
    description: settingsCopy.profile.fields.name.description,
    placeholder: settingsCopy.profile.fields.name.placeholder,
  },
  {
    id: "settings-cpf",
    key: "cpf",
    label: settingsCopy.profile.fields.cpf.label,
    description: settingsCopy.profile.fields.cpf.description,
    placeholder: settingsCopy.profile.fields.cpf.placeholder,
    inputMode: "numeric",
    normalize: formatCpf,
  },
  {
    id: "settings-phone",
    key: "phone",
    label: settingsCopy.profile.fields.phone.label,
    description: settingsCopy.profile.fields.phone.description,
    placeholder: settingsCopy.profile.fields.phone.placeholder,
    inputMode: "tel",
    normalize: (value) => formatPhone(onlyDigits(value)),
  },
  {
    id: "settings-email",
    key: "email",
    label: settingsCopy.profile.fields.email.label,
    description: settingsCopy.profile.fields.email.description,
    placeholder: settingsCopy.profile.fields.email.placeholder,
    type: "email",
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

    await notify.track(onSave(form), {
      loading: settingsCopy.profile.saveFeedback.loading,
      success: settingsCopy.profile.saveFeedback.success,
      error: settingsCopy.profile.saveFeedback.error,
    })
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

          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {settingsCopy.profile.sectionDescription}
            </p>

            <div className="flex justify-center py-2">
              <AvatarUpload name={form.name} />
            </div>

            <div className="flex flex-col gap-3">
              {profileFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-md border border-border/50 px-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
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
                      disabled={isSaving}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t px-4 py-3">
            <Button type="submit" disabled={isSaving}>
              {settingsCopy.profile.saveButton}
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
