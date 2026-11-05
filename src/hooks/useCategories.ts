import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CASHFLOW_ORDER, type CashflowRow, type CategoryRow } from "@/types/db"

export function useCategories() {
  const [cashflows, setCashflows] = useState<CashflowRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [cf, cat] = await Promise.all([
      supabase.from("cashflows").select("*"),
      supabase.from("categories").select("*").order("sort_order").order("name"),
    ])

    const err = cf.error ?? cat.error
    if (err) {
      setError(err.message)
    } else {
      const sorted = [...(cf.data as CashflowRow[])].sort(
        (a, b) => CASHFLOW_ORDER.indexOf(a.code) - CASHFLOW_ORDER.indexOf(b.code)
      )
      setCashflows(sorted)
      setCategories(cat.data as CategoryRow[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { cashflows, categories, loading, error, refresh }
}