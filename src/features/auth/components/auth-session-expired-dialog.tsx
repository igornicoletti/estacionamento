import * as React from "react"
import { ClockIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { authCopy } from "../auth-copy"
import { consumeInactivitySessionExpired } from "./auth-inactivity-guard"

export function AuthSessionExpiredDialog() {
  const [open, setOpen] = React.useState(() => consumeInactivitySessionExpired())

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <ClockIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {authCopy.inactivity.expiredTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {authCopy.inactivity.expiredDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction size="lg">
            {authCopy.inactivity.expiredConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
