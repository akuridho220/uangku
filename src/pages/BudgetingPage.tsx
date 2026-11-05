import { useMemo, useState } from "react"
import { Copy } from "lucide-react"
import { useBudgets } from "@/hooks/useBudgets"
import { useCategories } from "@/hooks/useCategories"
import { useTransactions } from "@/hooks/useTransactions"
import { currentMonthKey } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { MonthNav } from "@/components/MonthNav"
import { BudgetSection, type Section } from "@/components/budgeting/BudgetSection"

export default function BudgetingPage() {
  const [month, setMonth] = useState(currentMonthKey())
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const bud = useBudgets(month)
  const tx = useTransactions(month)
  const cat = useCategories()

  const budgetByCategory = useMemo(
    () => new Map(bud.budgets.map((b) => [b.category_id, b.amount])),
    [bud.budgets]
  )

  const actualByCategory = useMemo(() => {
    const incomeCfIds = new Set(
      cat.cashflows.filter((cf) => cf.code === "income").map((cf) => cf.id)
    )
    const incomeCategoryIds = new Set(
      cat.categories.filter((c) => incomeCfIds.has(c.cashflow_id)).map((c) => c.id)
    )
    const map = new Map<string, number>()
    for (const t of tx.transactions) {
      if (!t.category_id) continue
      const sign = t.account_in_id && !incomeCategoryIds.has(t.category_id) ? -1 : 1
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + sign * t.amount)
    }
    return map
  }, [tx.transactions, cat.cashflows, cat.categories])

  const sections: Section[] = useMemo(
    () =>
      cat.cashflows.map((cf) => {
        // kategori arsip tetap tampil kalau bulan ini punya budget/transaksi di dalamnya
        const cats = cat.categories.filter(
          (c) =>
            c.cashflow_id === cf.id &&
            (!c.is_archived || budgetByCategory.has(c.id) || actualByCategory.has(c.id))
        )
        return {
          cf,
          cats,
          budget: cats.reduce((s, c) => s + (budgetByCategory.get(c.id) ?? 0), 0),
          actual: cats.reduce((s, c) => s + (actualByCategory.get(c.id) ?? 0), 0),
        }
      }),
    [cat.cashflows, cat.categories, budgetByCategory, actualByCategory]
  )

  const income = sections.find((s) => s.cf.code === "income")
  const outflow = sections.filter((s) => s.cf.code !== "income")
  const outBudget = outflow.reduce((s, x) => s + x.budget, 0)
  const outActual = outflow.reduce((s, x) => s + x.actual, 0)

  const loading = bud.loading || tx.loading || cat.loading
  const error = bud.error ?? tx.error ?? cat.error

  function changeMonth(next: string) {
    setMonth(next)
    setMessage(null)
    setActionError(null)
  }

  async function handleSave(categoryId: string, amount: number | null) {
    setActionError(null)
    try {
      await bud.saveBudget(categoryId, amount)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal menyimpan budget.")
    }
  }

  async function handleCopy() {
    setActionError(null)
    setMessage(null)
    try {
      const allowed = new Set(cat.categories.filter((c) => !c.is_archived).map((c) => c.id))
      const n = await bud.copyFromPrevious(allowed)
      setMessage(
        n > 0
          ? `${n} budget disalin dari bulan sebelumnya.`
          : "Tidak ada budget baru untuk disalin."
      )
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal menyalin budget.")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Budgeting</h1>
        <Button variant="outline" onClick={handleCopy} className="gap-2" disabled={loading}>
          <Copy className="size-4" />
          <span className="hidden sm:inline">Salin dari bulan lalu</span>
          <span className="sm:hidden">Salin</span>
        </Button>
      </div>

      <MonthNav month={month} onChange={changeMonth} />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Gagal memuat: {error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pemasukan</p>
              <p className="mt-1 font-semibold text-green-600">
                {formatRupiah(income?.actual ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                dari target {formatRupiah(income?.budget ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pengeluaran</p>
              <p className="mt-1 font-semibold text-red-600">{formatRupiah(outActual)}</p>
              <p className="text-xs text-muted-foreground">
                dari budget {formatRupiah(outBudget)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((s) => (
              <BudgetSection
                key={s.cf.id}
                section={s}
                budgetByCategory={budgetByCategory}
                actualByCategory={actualByCategory}
                onSave={handleSave}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}