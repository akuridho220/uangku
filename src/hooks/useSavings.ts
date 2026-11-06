import { useMemo } from "react"
import type { useCategories } from "@/hooks/useCategories"
import { useSavingData } from "@/hooks/useSavingData"
import { computePot, type PotStats } from "@/lib/savings"

type CategoriesState = ReturnType<typeof useCategories>

export function useSavings(cat: CategoriesState) {
  const groups = useMemo(
    () =>
      cat.cashflows
        .filter((cf) => cf.code === "saving_invest" || cf.code === "financial_goals")
        .map((cf) => ({
          cf,
          pots: cat.categories.filter((c) => c.cashflow_id === cf.id && !c.is_archived),
        })),
    [cat.cashflows, cat.categories]
  )

  const potIds = useMemo(() => groups.flatMap((g) => g.pots.map((p) => p.id)), [groups])
  const data = useSavingData(potIds, !cat.loading)

  const stats = useMemo(() => {
    const map = new Map<string, PotStats>()
    for (const g of groups) {
      for (const p of g.pots) map.set(p.id, computePot(p, data.flows, data.valuations))
    }
    return map
  }, [groups, data.flows, data.valuations])

  return { groups, stats, loading: data.loading, error: data.error }
}