const PT_BR_LOCALE = "pt-BR"

const integerFormatter = new Intl.NumberFormat(PT_BR_LOCALE, {
  maximumFractionDigits: 0,
})

const pluralRules = new Intl.PluralRules(PT_BR_LOCALE, {
  type: "cardinal",
})

function normalizeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0
}

function formatInteger(value: number): string {
  return integerFormatter.format(normalizeCount(value))
}

function isSingular(value: number): boolean {
  return pluralRules.select(normalizeCount(value)) === "one"
}

export function formatSelectedRows(
  selectedRowCount: number,
  rowCount: number
): string {
  const selected = normalizeCount(selectedRowCount)
  const label = isSingular(selected)
    ? "linha selecionada"
    : "linhas selecionadas"

  return `${formatInteger(selected)} ${label} de ${formatInteger(rowCount)}.`
}

export function formatDisplayedRows(
  displayedRowCount: number,
  rowCount: number
): string {
  const label = isSingular(rowCount) ? "linha" : "linhas"

  return `Exibindo ${formatInteger(displayedRowCount)} de ${formatInteger(rowCount)} ${label}.`
}

export function formatPageOf(
  currentPage: number,
  pageCountLabel: string | number
): string {
  const formattedPageCount =
    typeof pageCountLabel === "number"
      ? formatInteger(pageCountLabel)
      : pageCountLabel

  return `Página ${formatInteger(currentPage)} de ${formattedPageCount}`
}

export const dataTableCopy = {
  accessibility: {
    scrollableTable: "Tabela com rolagem horizontal",
    actionsColumn: "Ações",
    openRowActions: "Abrir ações da linha",
    selectRow: "Selecionar linha",
    selectPageRows: "Selecionar todas as linhas desta página",
    clearSearchPrefix: "Limpar",
    sortAscending: "Ordenar em ordem ascendente",
    sortDescending: "Ordenar em ordem descendente",
    clearSorting: "Remover ordenação",
  },
  loading: {
    initialAnnouncement: "Carregando dados da tabela.",
    refetchAnnouncement: "Atualizando dados da tabela.",
  },
  toolbar: {
    clearFilters: "Limpar filtros",
    clearFiltersAriaLabel: "Limpar todos os filtros da tabela",
    controlsTitle: "Filtros e ações",
    controlsDescription: "Busca, filtros, colunas e exportação da listagem.",
    export: "Exportar",
    exportAriaLabel: "Abrir menu de exportação",
    exportTooltip: "Exportar dados da tabela",
    search: "Buscar",
    searchPlaceholder: "Buscar registros",
    filterPlaceholderPrefix: "Filtrar por",
  },
  exportMenu: {
    title: "Exportar dados",
    currentView: "Exportar página atual",
    currentViewDescription:
      "Exportar as linhas exibidas na página atual e as colunas visíveis.",
    filteredRows: "Exportar resultados filtrados",
    filteredRowsDescription:
      "Exportar todas as linhas correspondentes aos filtros e as colunas visíveis.",
    loadedRows: "Exportar registros carregados",
    loadedRowsDescription:
      "Exportar todos os registros carregados na tabela e as colunas marcadas como exportáveis.",
  },
  facetedFilter: {
    noResults: "Nenhum resultado encontrado.",
    selectedSuffix: "selecionados",
    clearFilters: "Limpar filtros",
  },
  fallback: {
    errorTitle: "Não foi possível carregar os dados",
    errorDescription:
      "A tabela não pôde carregar os registros. Verifique sua conexão e tente novamente.",
    errorAction: "Tentar novamente",
    emptyTitle: "Nenhum registro encontrado",
    emptyDescription: "Não há registros para exibir nesta tabela.",
    filteredEmptyTitle: "Nenhum resultado encontrado",
    filteredEmptyDescription:
      "Nenhum registro corresponde aos filtros aplicados. Limpe os filtros para voltar à listagem completa.",
    filteredEmptyAction: "Limpar filtros",
  },
  pagination: {
    rowsPerPage: "Linhas por página",
    unknownPageCount: "desconhecido",
    firstPage: "Ir para a primeira página",
    previousPage: "Ir para a página anterior",
    nextPage: "Ir para a próxima página",
    lastPage: "Ir para a última página",
    selectedRows: formatSelectedRows,
    displayedRows: formatDisplayedRows,
    pageOf: formatPageOf,
  },
  columnHeader: {
    ascending: "Ascendente",
    descending: "Descendente",
    hide: "Ocultar",
  },
  viewOptions: {
    trigger: "Colunas",
    tooltip: "Gerenciar colunas visíveis",
  },
} as const
