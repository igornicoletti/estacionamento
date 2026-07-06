import { SearchIcon, SearchXIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import {
  searchableRouteDefinitions,
  type SearchableRouteDefinition,
} from "@/app/router/route-definitions"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { InputGroupAddon } from "@/components/ui/input-group"
import { shouldBypassAuthInDev } from "@/config"
import { hasAllCapabilities } from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"

import { getAuthProfileRole } from "./route-auth-utils"
import { RouteStatusPage } from "./route-status-page"

function getRouteSearchValue(route: SearchableRouteDefinition): string {
  return `${route.label} ${route.href} ${route.description}`
}

function canSearchRoute(
  route: SearchableRouteDefinition,
  role: ReturnType<typeof getAuthProfileRole>
) {
  if (shouldBypassAuthInDev()) {
    return true
  }

  if (!route.requiredCapabilities || route.requiredCapabilities.length === 0) {
    return true
  }

  return hasAllCapabilities(role, route.requiredCapabilities)
}

export function NotFoundRoute() {
  const navigate = useNavigate()
  const { profile } = useAuthSession()
  const role = getAuthProfileRole(profile)

  const authorizedRouteOptions = React.useMemo(
    () =>
      searchableRouteDefinitions.filter((route) => {
        return canSearchRoute(route, role)
      }),
    [role]
  )

  const routeOptions = React.useMemo(() => {
    if (authorizedRouteOptions.length > 0) {
      return authorizedRouteOptions
    }

    // Fallback para evitar lista vazia enquanto perfil/capabilities não estão resolvidos.
    return searchableRouteDefinitions
  }, [authorizedRouteOptions])

  React.useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target

      const isEditableElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)

      if (event.key !== "/" || isEditableElement) {
        return
      }

      event.preventDefault()

      const input = document.getElementById("not-found-route-search")

      if (input instanceof HTMLInputElement) {
        input.focus()
      }
    }

    document.addEventListener("keydown", handleShortcut)

    return () => {
      document.removeEventListener("keydown", handleShortcut)
    }
  }, [])

  function handleRouteChange(route: SearchableRouteDefinition | null) {
    if (!route) {
      return
    }

    void navigate(route.href)
  }

  return (
    <RouteStatusPage
      icon={<SearchXIcon />}
      title="404 — Página não encontrada"
      description={
        "A página que você está procurando não existe. Pesquise abaixo pela página que precisa."
      }
    >
      <Combobox<SearchableRouteDefinition>
        items={routeOptions}
        value={null}
        onValueChange={handleRouteChange}
        itemToStringLabel={(route) => route.label}
        itemToStringValue={getRouteSearchValue}
      >
        <ComboboxInput
          id="not-found-route-search"
          placeholder="Pesquisar páginas..."
          className="w-full"
        >
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxEmpty>Nenhuma página encontrada.</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(route: SearchableRouteDefinition) => (
                <ComboboxItem key={route.href} value={route}>
                  {route.label}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </RouteStatusPage>
  )
}
