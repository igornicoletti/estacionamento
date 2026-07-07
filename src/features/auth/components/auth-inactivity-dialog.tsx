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
import { Button } from "@/components/ui/button"

import { authCopy } from "../auth-copy"

interface AuthInactivityDialogProps {
  open: boolean
  secondsRemaining: number
  onContinueSession: () => void
  onSignOutNow: () => void
}

export function AuthInactivityDialog({
  open,
  secondsRemaining,
  onContinueSession,
  onSignOutNow,
}: AuthInactivityDialogProps) {
  const copy = authCopy.inactivity

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="mx-auto">
            <ClockIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {copy.description} {copy.secondsRemaining(secondsRemaining)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" size="lg" onClick={onSignOutNow}>
            {copy.signOutNow}
          </Button>
          <AlertDialogAction size="lg" onClick={onContinueSession}>
            {copy.continueSession}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
