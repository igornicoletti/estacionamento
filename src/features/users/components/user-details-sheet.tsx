import { AppDetailsSheet } from "@/components/shared/app-details-sheet"

import { usersCopy } from "../constants/users-copy"
import { getUserDetailItems } from "../model/users-models"
import { type UserRecord } from "../model/users-types"

interface UserDetailsSheetProps {
  user: UserRecord | null
  onOpenChange: (open: boolean) => void
}

export function UserDetailsSheet({ user, onOpenChange }: UserDetailsSheetProps) {
  return (
    <AppDetailsSheet
      open={Boolean(user)}
      onOpenChange={onOpenChange}
      title={user ? usersCopy.details.title : undefined}
      description={
        user
          ? usersCopy.details.description
          : undefined
      }
      items={user ? getUserDetailItems(user) : []}
    />
  )
}
