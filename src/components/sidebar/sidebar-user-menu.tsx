import {
  BellIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"

import { shouldBypassAuthInDev } from "@/config"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  isUserRole,
  userRoleLabels,
} from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"

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

  return isUserRole(profile.role) ? userRoleLabels[profile.role] : "Perfil"
}

export function UserMenu() {
  const { profile, signOut } = useAuthSession()
  const navigate = useNavigate()
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const displayName = getProfileName(profile)
  const displayMeta = getProfileMeta(profile)
  const fallback = getFallback(displayName)

  async function handleSignOut() {
    await signOut()
    void navigate("/login", { replace: true })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 px-2">
            <Avatar>
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
            <DropdownMenuItem asChild>
              <Link to="/perfil">
                <UserIcon />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <SettingsIcon />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notificacoes">
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

      <DestructiveConfirmDialog
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        title="Encerrar sessão"
        description="Deseja realmente sair agora? Você precisará fazer login novamente para continuar."
        confirmLabel="Sair"
        onConfirm={async () => {
          await handleSignOut()
        }}
      />
    </>
  )
}
