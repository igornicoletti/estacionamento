import { AppRouter } from "@/app/router"

import { AppProviders } from "./app/app-providers"

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
