import { AppDetailsSheet } from "@/components/shared/app-details-sheet"

import { usersCopy } from "../constants"
import {
  getUserDetailItems,
  resolveEmailLabel,
  type UserRecord,
} from "../model"

interface UserDetailsSheetProps {
  user: UserRecord | null
  onOpenChange: (open: boolean) => void
}

export function UserDetailsSheet({ user, onOpenChange }: UserDetailsSheetProps) {
  return (
    <AppDetailsSheet
      open={Boolean(user)}
      onOpenChange={onOpenChange}
      title={user?.name ?? usersCopy.details.title}
      description={user ? resolveEmailLabel(user.email) : undefined}
      items={user ? getUserDetailItems(user) : []}
    />
  )
}
