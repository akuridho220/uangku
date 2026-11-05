import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CASHFLOW_ORDER, type CashflowRow } from "@/types/db"

export function useCashflows() {
  const [cashflows, setCashflows] = useState<CashflowRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("cashflows").select("*")

    if (error) {
      setError(error.message)
    } else {
      const sorted = [...(data as CashflowRow[])].sort(
        (a, b) => CASHFLOW_ORDER.indexOf(a.code) - CASHFLOW_ORDER.indexOf(b.code)
      )
      setCashflows(sorted)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { cashflows, loading, error, refresh }
}