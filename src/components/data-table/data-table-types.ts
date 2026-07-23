import type { RowData } from "@tanstack/react-table"
import type { ReactNode } from "react"

/**
 * Valor neutro aceito pelo pipeline de exportação.
 *
 * O tipo permanece independente da biblioteca usada
 * para produzir XLSX, CSV ou outro formato tabular.
 */
export type DataTableExportCellValue =
  | string
  | number
  | boolean
  | null
  | undefined

declare module "@tanstack/react-table" {
  interface ColumnMeta<
    TData extends RowData,
    TValue
  > {
    /**
     * Nome legível da coluna para menus,
     * exportação e superfícies auxiliares.
     */
    label?: string

    /**
     * false exclui explicitamente a coluna
     * dos fluxos de exportação.
     */
    enableExport?: boolean

    /**
     * Converte o valor do accessor em uma
     * representação tabular exportável.
     *
     * Não deve retornar JSX ou ReactNode.
     */
    exportValue?: (
      value: TValue,
      row: TData
    ) => DataTableExportCellValue
  }
}

declare const dataTableCustomColumnIdBrand:
  unique symbol

/**
 * Chaves reais existentes no objeto da linha.
 *
 * Use este tipo em factories baseadas em
 * accessorKey.
 */
export type DataTableAccessorKey<TData> =
  Extract<keyof TData, string>

/**
 * ID nominal de uma coluna calculada, display
 * column ou coluna criada com accessorFn.
 */
export type DataTableCustomColumnId<
  TId extends string = string,
> = TId & {
  readonly [dataTableCustomColumnIdBrand]:
  "DataTableCustomColumnId"
}

/**
 * ID aceito para procurar uma coluna já criada
 * na instância do TanStack Table.
 */
export type DataTableColumnId<TData> =
  | DataTableAccessorKey<TData>
  | DataTableCustomColumnId

/**
 * Declara explicitamente um ID que não corresponde
 * diretamente a uma propriedade de TData.
 */
export function defineDataTableCustomColumnId<
  const TId extends string,
>(
  id: TId
): DataTableCustomColumnId<TId> {
  if (
    id.length === 0 ||
    id.trim() !== id
  ) {
    throw new TypeError(
      [
        "defineDataTableCustomColumnId:",
        "o ID deve ser uma string não vazia",
        "e sem espaços nas extremidades.",
      ].join(" ")
    )
  }

  return id as DataTableCustomColumnId<TId>
}

/**
 * Valor categórico canônico armazenado no
 * estado dos filtros facetados.
 */
export type DataTableFilterOptionValue =
  string

export interface DataTableFilterOption {
  /**
   * Contagem opcional fornecida pela coluna
   * ou por uma fonte remota.
   */
  count?: number

  /**
   * Texto apresentado ao usuário.
   */
  label: string

  /**
   * Identificador categórico canônico.
   */
  value: DataTableFilterOptionValue
}

export interface DataTableFilterOptionGroup {
  /**
   * Identificador estável recomendado quando
   * labels podem repetir ou mudar por tradução.
   */
  id?: string

  label: string
  options: readonly DataTableFilterOption[]
}

export type DataTableFacetCountSource =
  | "column"
  | "options"

export interface DataTableFilterField<TData> {
  id: DataTableColumnId<TData>
  title: string
  options: readonly DataTableFilterOption[]
  groups?: readonly DataTableFilterOptionGroup[]

  /**
   * Exibe contagens ao lado das opções.
   */
  showCounts?: boolean

  /**
   * "column": usa o modelo facetado do TanStack.
   * "options": usa DataTableFilterOption.count.
   */
  countSource?: DataTableFacetCountSource

  /**
   * Deve ser normalizado pelo componente antes
   * de controlar a quantidade de chips exibidos.
   */
  maxVisibleChips?: number
}

export interface DataTableSearchField<TData> {
  id: DataTableColumnId<TData>

  /**
   * Nome visual opcional do campo.
   * Quando omitido, a toolbar pode usar o
   * meta.label ou o header textual da coluna.
   */
  label?: string

  /**
   * Nome acessível independente do placeholder.
   */
  ariaLabel?: string

  placeholder?: string
}

export interface DataTableGlobalSearch<TData> {
  columnIds:
  readonly DataTableColumnId<TData>[]

  /**
   * Label visual opcional da busca global.
   */
  label?: string

  /**
   * Nome acessível independente do placeholder.
   */
  ariaLabel?: string

  placeholder?: string
}

export interface DataTableStateAction {
  label: string
  icon?: ReactNode
  onClick: () => void
}
