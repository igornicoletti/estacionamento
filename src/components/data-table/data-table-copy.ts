const PT_BR_LOCALE = "pt-BR"

const integerFormatter = new Intl.NumberFormat(PT_BR_LOCALE, {
  maximumFractionDigits: 0,
})

function normalizeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0
}

function formatInteger(value: number): string {
  return integerFormatter.format(normalizeCount(value))
}

function isSingular(value: number): boolean {
  return normalizeCount(value) === 1
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

export function formatResultCount(resultCount: number): string {
  const count = normalizeCount(resultCount)
  const label = isSingular(count) ? "resultado" : "resultados"

  return `${formatInteger(count)} ${label}`
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
    addFilter: "Filtros",
    addFilterAriaLabel: "Abrir filtros da tabela",
    allFiltersAdded: "Todos os filtros já foram adicionados",
    export: "Exportar",
    exportAriaLabel: "Abrir menu de exportação",
    exportTooltip: "Exportar dados da tabela",
    search: "Buscar",
    searchPlaceholder: "Buscar registros",
    filterPlaceholderPrefix: "Filtrar por",
    searchFilterPlaceholderPrefix: "Buscar em",
    removeFilterPrefix: "Remover filtro",
    results: formatResultCount,
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
    noResults: "Nenhuma opção encontrada.",
    selectedSuffix: "selecionados",
    clearFilter: "Limpar",
    clearFilterAriaLabelPrefix: "Limpar filtro",
  },
  fallback: {
    errorTitle: "Não foi possível carregar os dados",
    errorDescription: "Verifique sua conexão e tente novamente.",
    errorAction: "Tentar novamente",
    emptyTitle: "Nenhum registro encontrado",
    emptyDescription: "Não há registros para exibir.",
    filteredEmptyTitle: "Nenhum resultado encontrado",
    filteredEmptyDescription: "Ajuste a busca ou remova um filtro.",
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
