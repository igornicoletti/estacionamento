
export type SignOutConfirmationCopy = {
  title: string
  description: string
  actionLabel: string
  pendingLabel: string
}

export type UserMenuProfileView = {
  displayName: string
  displayMeta: string
  fallback: string
  avatarUrl: string | null
  authUserId: string | null
  email: string | null
}

export type UserMenuLabels = {
  account: string
  changePhoto: string
  profile: string
  openMenu: (name: string) => string
}

