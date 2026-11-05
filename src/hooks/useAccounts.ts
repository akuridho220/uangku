import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { AccountRow } from "@/types/db"

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("account_balances")
      .select("*")
      .order("sort_order")
      .order("name")

    if (error) {
      setError(error.message)
    } else {
      setAccounts(data as AccountRow[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { accounts, loading, error, refresh }
}