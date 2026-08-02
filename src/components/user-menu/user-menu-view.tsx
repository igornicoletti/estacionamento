import type * as React from "react"

import { CameraIcon, LogOutIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type {
  UserMenuLabels,
  UserMenuProfileView,
} from "./user-menu.types"

export type UserMenuViewProps = {
  profile: UserMenuProfileView
  labels: UserMenuLabels
  changePhotoDisabled?: boolean
  renderProfileLink: (children: React.ReactNode) => React.ReactElement
  onChangePhoto: () => void
  onSignOutMobile: () => void
  signOutLabel: string
}

export function UserMenuView({
  profile,
  labels,
  changePhotoDisabled = false,
  renderProfileLink,
  onChangePhoto,
  onSignOutMobile,
  signOutLabel,
}: UserMenuViewProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 min-w-0 gap-2 px-2"
          aria-label={labels.openMenu(profile.displayName)}
        >
          <Avatar>
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback>{profile.fallback}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start md:flex">
            <span className="max-w-40 truncate text-sm font-medium">
              {profile.displayName}
            </span>
            <span className="max-w-40 truncate text-xs text-muted-foreground">
              {profile.displayMeta}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(18rem,calc(100vw-2rem))]"
      >
        <DropdownMenuLabel className="font-normal">
          <span className="sr-only">{labels.account}</span>
          <span className="grid text-left text-sm leading-tight">
            <span className="truncate font-medium">{profile.displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {profile.displayMeta}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={changePhotoDisabled}
            onSelect={onChangePhoto}
          >
            <CameraIcon aria-hidden="true" />
            {labels.changePhoto}
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            {renderProfileLink(
              <>
                <UserIcon aria-hidden="true" />
                {labels.profile}
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="lg:hidden" />

        <DropdownMenuItem
          variant="destructive"
          className="lg:hidden"
          onSelect={onSignOutMobile}
        >
          <LogOutIcon aria-hidden="true" />
          {signOutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
