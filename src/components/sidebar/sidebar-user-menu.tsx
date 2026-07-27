import {
  BellIcon,
  CameraIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { shouldBypassAuthInDev } from "@/config"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthSession } from "@/features/auth/hooks"
import { getProfileInitials, ProfilePhotoDialog } from "@/features/my-profile/components"
import {
  updateCurrentProfile,
  uploadProfileAvatarFile,
} from "@/features/my-profile/services/profile-service"

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
    return shouldBypassAuthInDev() ? "Modo desenvolvimento" : "Perfil"
  }

  const role = profile.role

  if (isRecord(role) && typeof role.label === "string" && role.label.trim()) {
    return role.label.trim()
  }

  return "Perfil"
}

function getProfileStringField(profile: unknown, field: string) {
  if (!isRecord(profile) || typeof profile[field] !== "string") {
    return null
  }

  const value = profile[field].trim()
  return value || null
}

export function UserMenu() {
  const { profile, refresh, signOut } = useAuthSession()
  const navigate = useNavigate()
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const displayName = getProfileName(profile)
  const displayMeta = getProfileMeta(profile)
  const fallback = getFallback(displayName)
  const avatarUrl = getProfileStringField(profile, "avatarUrl")
  const authUserId = getProfileStringField(profile, "authUserId")
  const email = getProfileStringField(profile, "email")

  async function handleSignOut() {
    await signOut()
    void navigate("/login", { replace: true })
  }

  async function handleSavePhotoFile(payload: {
    file: File
    previewUrl: string
  }) {
    if (!authUserId || isSavingPhoto) {
      return
    }

    setIsSavingPhoto(true)

    try {
      const avatarPath = await uploadProfileAvatarFile(payload.file, authUserId)

      await updateCurrentProfile({
        avatarPath,
        avatarPreviewUrl: payload.previewUrl,
        email,
        name: displayName,
      })
      await refresh()
      setIsPhotoDialogOpen(false)
    } finally {
      setIsSavingPhoto(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 gap-2 px-2"
            aria-label={sidebarCopy.menu.openUserMenu(displayName)}
          >
            <Avatar>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
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
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setIsPhotoDialogOpen(true)
              }}
            >
              <CameraIcon />
              {sidebarCopy.menu.changePhoto}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={appRoutePaths.profile}>
                <UserIcon />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={appRoutePaths.profile}>
                <SettingsIcon />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={appRoutePaths.notifications}>
                <BellIcon />
                Notificações
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
              Sair
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {isPhotoDialogOpen ? (
        <ProfilePhotoDialog
          avatarUrl={avatarUrl}
          fallback={getProfileInitials(displayName)}
          isSaving={isSavingPhoto}
          onOpenChange={setIsPhotoDialogOpen}
          onSaveFile={handleSavePhotoFile}
          open={isPhotoDialogOpen}
        />
      ) : null}

      <AppAlertDialog
        size="sm"
        tone="destructive"
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        title="Encerrar sessão"
        description="Deseja realmente sair agora? Você precisará fazer login novamente para continuar."
        actionLabel="Sair"
        pendingLabel="Saindo..."
        onAction={handleSignOut}
      />
    </>
  )
}
