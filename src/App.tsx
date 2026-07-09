import { AppProviders } from '@/app/app-providers'
import { AppRouter } from "@/app/router"

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
