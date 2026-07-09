import { SearchIcon, SearchXIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import {
  searchableRouteDefinitions,
  type SearchableRouteDefinition,
} from "@/app/router/route-definitions"
import { AppEmptyState } from "@/components/shared/app-empty-state"
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
import { useAuthSession } from "@/features/auth/hooks"

import {
  canRoleAccessCapabilities,
  getAuthProfileRole,
} from "./route-auth-utils"

function getRouteSearchValue(route: SearchableRouteDefinition): string {
  return `${route.label} ${route.href} ${route.description}`
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function NotFoundRoute() {
  const navigate = useNavigate()
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)
  const { profile } = useAuthSession()
  const role = getAuthProfileRole(profile)

  const routeOptions = React.useMemo(() => {
    return searchableRouteDefinitions.filter((route) => {
      return canRoleAccessCapabilities(role, route.requiredCapabilities)
    })
  }, [role])

  React.useEffect(() => {
    if (routeOptions.length === 0) {
      return
    }

    function handleShortcut(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) {
        return
      }

      event.preventDefault()
      searchInputRef.current?.focus()
    }

    document.addEventListener("keydown", handleShortcut)

    return () => {
      document.removeEventListener("keydown", handleShortcut)
    }
  }, [routeOptions.length])

  function handleRouteChange(route: SearchableRouteDefinition | null) {
    if (!route) {
      return
    }

    void navigate(route.href)
  }

  return (
    <section className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <AppEmptyState
        className="max-w-xl"
        media={<SearchXIcon />}
        title="404 — Página não encontrada"
        description="A página que você está procurando não existe. Pesquise abaixo por uma página disponível para o seu perfil."
      >
        {routeOptions.length > 0 ? (
          <Combobox<SearchableRouteDefinition>
            items={routeOptions}
            value={null}
            onValueChange={handleRouteChange}
            itemToStringLabel={(route) => route.label}
            itemToStringValue={getRouteSearchValue}
          >
            <ComboboxInput
              ref={searchInputRef}
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
        ) : null}
      </AppEmptyState>
    </section>
  )
}
