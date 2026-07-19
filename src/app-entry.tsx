import { AppProviders, AppRouter } from "./app/index"

export default function AppEntry() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
