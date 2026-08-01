import { CircleAlertIcon } from "lucide-react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { preventDialogCloseOnFloatingLayerInteraction } from "@/lib/dialog-interactions"

import { usersCopy } from "../constants/users-copy"
import {
  type UnitCatalogItem,
  type UserRecord,
  type UserRole,
} from "../model/users-types"
import {
  createDefaultUsersFormValues,
  getUsersFormFieldErrors,
  mapUserToUsersFormValues,
  type UsersFormFieldName,
  type UsersFormValues,
  usersFormSchema,
} from "../schemas/users-form-schema"
import {
  UserFormFields,
  usersFormControlIdByField,
  usersFormFieldFocusOrder,
} from "./user-form-fields"

interface UserFormDialogProps {
  assignableRoleValues: readonly UserRole[]
  editingUser: UserRecord | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UsersFormValues) => Promise<void>
  open: boolean
  unitCatalog: readonly UnitCatalogItem[]
  unitCatalogError?: boolean
}

export function UserFormDialog({
  assignableRoleValues,
  editingUser,
  isSaving,
  onOpenChange,
  onSubmit,
  open,
  unitCatalog,
  unitCatalogError = false,
}: UserFormDialogProps) {
  const formId = React.useId()
  const [values, setValues] = React.useState<UsersFormValues>(() =>
    editingUser
      ? mapUserToUsersFormValues(editingUser)
      : createDefaultUsersFormValues(assignableRoleValues)
  )
  const [errors, setErrors] = React.useState<
    Partial<Record<UsersFormFieldName, string>>
  >({})
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const isSubmittingRef = React.useRef(false)
  const isEditMode = editingUser !== null

  function resetFormState() {
    setValues(
      editingUser
        ? mapUserToUsersFormValues(editingUser)
        : createDefaultUsersFormValues(assignableRoleValues)
    )
    setErrors({})
    setSubmitError(null)
  }

  function setValue<Key extends keyof UsersFormValues>(
    key: Key,
    value: UsersFormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving || isSubmittingRef.current) {
      return
    }

    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetFormState()
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving || isSubmittingRef.current) {
      return
    }

    setSubmitError(null)

    const result = usersFormSchema.safeParse(values)

    if (!result.success) {
      const fieldErrors = getUsersFormFieldErrors(result.error)
      const firstInvalidField = usersFormFieldFocusOrder.find(
        (fieldName) => fieldErrors[fieldName]
      )

      setErrors(fieldErrors)

      window.requestAnimationFrame(() => {
        const controlId = firstInvalidField
          ? usersFormControlIdByField[firstInvalidField]
          : undefined

        if (controlId) {
          document.getElementById(controlId)?.focus()
        }
      })
      return
    }

    isSubmittingRef.current = true

    try {
      await onSubmit(result.data)
      resetFormState()
      onOpenChange(false)
    } catch {
      setSubmitError(
        isEditMode
          ? usersCopy.feedback.update.error
          : usersCopy.feedback.create.error
      )
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        isEditMode
          ? usersCopy.dialogs.editTitle
          : usersCopy.dialogs.createTitle
      }
      description={
        isEditMode
          ? usersCopy.dialogs.editDescription
          : usersCopy.dialogs.createDescription
      }
      contentProps={{
        onInteractOutside: preventDialogCloseOnFloatingLayerInteraction,
      }}
      footerClassName="grid grid-cols-2"
      footer={(
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
          >
            {usersCopy.dialogs.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            size="lg"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {isSaving
              ? isEditMode
                ? usersCopy.feedback.update.loading
                : usersCopy.feedback.create.loading
              : isEditMode
                ? usersCopy.actions.save
                : usersCopy.actions.create}
          </Button>
        </>
      )}
    >
      <form
        id={formId}
        aria-label={
          isEditMode
            ? usersCopy.dialogs.editTitle
            : usersCopy.dialogs.createTitle
        }
        aria-busy={isSaving}
        noValidate
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <UserFormFields
          assignableRoleValues={assignableRoleValues}
          errors={errors}
          isSaving={isSaving}
          onValueChange={setValue}
          unitCatalog={unitCatalog}
          unitCatalogError={unitCatalogError}
          values={values}
        />

        {submitError ? (
          <Alert variant="destructive" className="mt-4">
            <CircleAlertIcon data-icon="inline-start" aria-hidden="true" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
      </form>
    </AppDialog>
  )
}
