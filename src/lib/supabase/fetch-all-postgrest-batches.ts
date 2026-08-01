interface FetchAllPostgrestBatchesOptions<TRow> {
  batchSize: number
  loadBatch: (from: number, to: number) => Promise<readonly TRow[]>
  maxBatches: number
  onLimitExceeded: () => Error
}

export async function fetchAllPostgrestBatches<TRow>({
  batchSize,
  loadBatch,
  maxBatches,
  onLimitExceeded,
}: FetchAllPostgrestBatchesOptions<TRow>) {
  const rows: TRow[] = []

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const from = batch * batchSize
    const to = from + batchSize - 1
    const chunk = await loadBatch(from, to)

    rows.push(...chunk)

    if (chunk.length < batchSize) {
      return rows
    }
  }

  throw onLimitExceeded()
}
