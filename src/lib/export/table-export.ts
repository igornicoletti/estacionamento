import {
  buildTimestampedFilename,
  downloadBlob,
} from "./download"
import {
  createXlsxBlob,
  type XlsxColumn,
  type XlsxSheet,
} from "./xlsx"

export interface ExportRowsToXlsxOptions<TRow> {
  /** Base file name, without extension. A timestamp is appended automatically. */
  filename: string
  /** Worksheet tab name. */
  sheetName: string
  columns: readonly XlsxColumn<TRow>[]
  rows: readonly TRow[]
}

/**
 * High-level helper that serializes tabular data to a real `.xlsx` workbook and
 * triggers a timestamped browser download. Returns the generated [Blob] so the
 * caller can also inspect, upload, or test it.
 */
export function exportRowsToXlsx<TRow>({
  filename,
  sheetName,
  columns,
  rows,
}: ExportRowsToXlsxOptions<TRow>): Blob {
  const sheet: XlsxSheet<TRow> = {
    name: sheetName,
    columns,
    rows,
  }

  const blob = createXlsxBlob([sheet])

  downloadBlob(blob, buildTimestampedFilename(filename, "xlsx"))

  return blob
}
