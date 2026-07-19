import { Toaster } from "sonner"

export function ToastApp() {
  return (
    <Toaster
      richColors
      closeButton
      expand
      visibleToasts={4}
      position="top-right"
      toastOptions={{
        duration: 5000,
      }}
    />
  )
}
