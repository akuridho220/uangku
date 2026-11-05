import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { TransactionRow, ValuationRow } from "@/types/db"

async function fetchFlows(ids: string[]) {
  const all: TransactionRow[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .in("category_id", ids)
      .order("tx_date")
      .order("id")
      .range(offset, offset + 999)
    if (error) throw new Error(error.message)
    all.push(...(data as TransactionRow[]))
    if (!data || data.length < 1000) break
  }
  return all
}

export function useSavingData(categoryIds: string[], ready: boolean) {
  const key = categoryIds.join(",")
  const [flows, setFlows] = useState<TransactionRow[]>([])
  const [valuations, setValuations] = useState<ValuationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!ready) return
    if (!key) {
      setFlows([])
      setValuations([])
      setLoading(false)
      return
    }
    const ids = key.split(",")
    try {
      const [f, v] = await Promise.all([
        fetchFlows(ids),
        supabase.from("valuations").select("*").in("category_id", ids).order("val_date"),
      ])
      if (v.error) throw new Error(v.error.message)
      setFlows(f)
      setValuations(v.data as ValuationRow[])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data tabungan.")
    }
    setLoading(false)
  }, [key, ready])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { flows, valuations, loading, error, refresh }
}