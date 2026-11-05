import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { monthRange } from "@/lib/date"
import type { TransactionRow } from "@/types/db"

export function useTransactions(month: string) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    const { from, to } = monthRange(month)

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("tx_date", from)
      .lt("tx_date", to)
      .order("tx_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (id !== requestId.current) return // abaikan respons usang saat pindah bulan cepat

    if (error) {
      setError(error.message)
    } else {
      setTransactions(data as TransactionRow[])
      setError(null)
    }
    setLoading(false)
  }, [month])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { transactions, loading, error, refresh }
}