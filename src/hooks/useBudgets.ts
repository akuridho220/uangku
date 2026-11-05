import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { shiftMonth } from "@/lib/date"
import type { BudgetRow } from "@/types/db"

function split(month: string) {
  const [year, mm] = month.split("-").map(Number)
  return { year, mm }
}

export function useBudgets(month: string) {
  const [budgets, setBudgets] = useState<BudgetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    const { year, mm } = split(month)

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("year", year)
      .eq("month", mm)

    if (id !== requestId.current) return

    if (error) {
      setError(error.message)
    } else {
      setBudgets(data as BudgetRow[])
      setError(null)
    }
    setLoading(false)
  }, [month])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** amount = null menghapus budget kategori tersebut di bulan ini. */
  const saveBudget = useCallback(
    async (categoryId: string, amount: number | null) => {
      const { year, mm } = split(month)

      if (amount === null) {
        const { error } = await supabase
          .from("budgets")
          .delete()
          .eq("category_id", categoryId)
          .eq("year", year)
          .eq("month", mm)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from("budgets")
          .upsert(
            { category_id: categoryId, year, month: mm, amount },
            { onConflict: "category_id,year,month" }
          )
        if (error) throw new Error(error.message)
      }
      await refresh()
    },
    [month, refresh]
  )

  /** Menyalin budget bulan lalu ke bulan ini, hanya untuk kategori yang belum punya budget. */
  const copyFromPrevious = useCallback(
    async (allowedCategoryIds: Set<string>) => {
      const prev = split(shiftMonth(month, -1))
      const { year, mm } = split(month)

      const { data, error } = await supabase
        .from("budgets")
        .select("category_id, amount")
        .eq("year", prev.year)
        .eq("month", prev.mm)
      if (error) throw new Error(error.message)

      const existing = new Set(budgets.map((b) => b.category_id))
      const rows = (data ?? [])
        .filter((b) => allowedCategoryIds.has(b.category_id) && !existing.has(b.category_id))
        .map((b) => ({ category_id: b.category_id, year, month: mm, amount: b.amount }))

      if (rows.length === 0) return 0

      const { error: err2 } = await supabase
        .from("budgets")
        .upsert(rows, { onConflict: "category_id,year,month" })
      if (err2) throw new Error(err2.message)

      await refresh()
      return rows.length
    },
    [month, budgets, refresh]
  )

  return { budgets, loading, error, refresh, saveBudget, copyFromPrevious }
}