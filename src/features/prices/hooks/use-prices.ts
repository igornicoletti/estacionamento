import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { pricesCopy } from "../constants"
import { listPriceTables, type PriceTablesResult } from "../services"

const initialPriceTablesResult: PriceTablesResult = {
  records: [],
  isTruncated: false,
  limit: 500,
}

function normalizeLegacyPriceRecord(record: PriceTablesResult["records"][number] & {
  computedStatus?: string
  parentId?: string | null
  tiers?: unknown[]
  version?: number
  scope?: string
}): PriceTablesResult["records"][number] {
  const rawScope = record.scope as string | undefined

  return {
    id: record.id,
    name: record.name ?? "Tabela sem nome",
    scope: (rawScope === "network" ? "global" : rawScope) as
      PriceTablesResult["records"][number]["scope"],
    unitId: record.unitId ?? null,
    unitName: record.unitName ?? null,
    graceMinutes: record.graceMinutes ?? 0,
    toleranceMinutes: record.toleranceMinutes ?? 0,
    cycleHours: record.cycleHours ?? 1,
    amount: record.amount ?? 0,
    startsAt: record.startsAt,
    endsAt: record.endsAt ?? null,
    status: record.status,
    notes: record.notes ?? null,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
  }
}

async function loadPriceTablesResult(): Promise<PriceTablesResult> {
  const result = await listPriceTables()

  if (Array.isArray(result)) {
    return {
      records: result.map((record) => normalizeLegacyPriceRecord(record as PriceTablesResult["records"][number])),
      isTruncated: false,
      limit: result.length,
    }
  }

  return result
}

export function usePriceTables() {
  const { data, error, isLoading, refetch } = useAsyncSnapshot<PriceTablesResult>({
    cacheKey: "prices:list",
    initialData: initialPriceTablesResult,
    loadData: loadPriceTablesResult,
    errorMessage: pricesCopy.feedback.loadError,
  })

  return {
    data: data.records,
    error,
    isLoading,
    isTruncated: data.isTruncated,
    limit: data.limit,
    refetch,
  }
}
