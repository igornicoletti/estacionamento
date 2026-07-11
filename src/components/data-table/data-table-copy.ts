export function formatSelectedRows(selectedRowCount: number, rowCount: number) {
  return `${selectedRowCount} de ${rowCount} linha(s) selecionada(s).`
}

export function formatDisplayedRows(displayedRowCount: number, rowCount: number) {
  const itemLabel = rowCount === 1 ? "item" : "itens"

  return `Exibindo ${displayedRowCount} de ${rowCount} ${itemLabel}.`
}

export function formatPageOf(currentPage: number, pageCountLabel: string) {
  return `Página ${currentPage} de ${pageCountLabel}`
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
    export: "Exportar",
    exportAriaLabel: "Exportar dados da tabela para Excel",
    exportTooltip: "Exportar",
    search: "Buscar",
    searchPlaceholder: "Buscar...",
    filterPlaceholderPrefix: "Filtrar",
  },
  facetedFilter: {
    noResults: "Nenhum resultado encontrado.",
    selectedSuffix: "selecionados",
    clearFilters: "Limpar filtros",
  },
  fallback: {
    errorTitle: "Não foi possível carregar os dados",
    errorDescription:
      "A tabela não pôde carregar os registros com segurança. Recarregue os dados e tente novamente.",
    errorAction: "Recarregar",
    emptyTitle: "Nenhum registro cadastrado",
    emptyDescription: "Ainda não há registros disponíveis para esta tabela.",
    emptyAction: "Adicionar registro",
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
    tooltip: "Colunas",
  },
} as const
