import { AppDetailsSheet } from "@/components/shared/app-details-sheet"

import { usersCopy } from "../constants"
import {
  getUserDetailItems,
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
      title={user ? usersCopy.details.title : undefined}
      description={
        user
          ? "Consulte os dados de acesso e vínculo do usuário selecionado."
          : undefined
      }
      items={user ? getUserDetailItems(user) : []}
    />
  )
}
