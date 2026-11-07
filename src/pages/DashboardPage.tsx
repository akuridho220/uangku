import { useMemo, useState } from "react"
import { useAccounts } from "@/hooks/useAccounts"
import { useBudgets } from "@/hooks/useBudgets"
import { useCategories } from "@/hooks/useCategories"
import { usePortfolio } from "@/hooks/usePortfolio"
import { useSavings } from "@/hooks/useSavings"
import { useTransactions } from "@/hooks/useTransactions"
import { currentMonthKey, daysInMonth } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { buildItems, type TxItem } from "@/lib/transactions"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthNav } from "@/components/MonthNav"
import { BudgetWatch } from "@/components/dashboard/BudgetWatch"
import { DailyBars } from "@/components/dashboard/DailyBars"
import { ExpensePie } from "@/components/dashboard/ExpensePie"
import { GoalsProgress } from "@/components/dashboard/GoalsProgress"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { SavingsSummary } from "@/components/dashboard/SavingsSummary"
import { StocksCard } from "@/components/dashboard/StocksCard"
import { BackupReminder } from "@/components/dashboard/BackupReminder"

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonthKey())

  const acc = useAccounts()
  const cat = useCategories()
  const tx = useTransactions(month)
  const bud = useBudgets(month)
  const sav = useSavings(cat)
  const pf = usePortfolio()

  const items = useMemo(
    () => buildItems(tx.transactions, cat.categories, cat.cashflows, acc.accounts),
    [tx.transactions, cat.categories, cat.cashflows, acc.accounts]
  )

  // Saldo account tanpa RDN: nilai RDN dihitung lewat portofolio saham, bukan saldo transfernya.
  const cashAccounts = acc.accounts.filter((a) => !a.is_archived && a.id !== pf.rdnId)
  const accountsTotal = cashAccounts.reduce((s, a) => s + a.balance, 0)

  const potsTotal = sav.groups
    .flatMap((g) => g.pots)
    .reduce((s, p) => {
      const st = sav.stats.get(p.id)
      return s + (st?.configured ? st.value : 0)
    }, 0)

  const totalAssets = accountsTotal + potsTotal + pf.portfolio.total

  // Pengeluaran = Spending + Bills. Disisihkan = setoran − pencairan Saving/Invest + Goals.
  const { stats, expenseItems } = useMemo(() => {
    let income = 0
    let expense = 0
    let saved = 0
    const expenseItems: TxItem[] = []

    for (const it of items) {
      if (it.kind === "income") {
        income += it.tx.amount
      } else if (it.kind === "withdrawal") {
        saved -= it.tx.amount
      } else if (it.kind === "outflow") {
        const code = it.cashflow?.code
        if (code === "saving_invest" || code === "financial_goals") {
          saved += it.tx.amount
        } else {
          expense += it.tx.amount
          expenseItems.push(it)
        }
      }
    }
    return { stats: { income, expense, saved, net: income - expense - saved }, expenseItems }
  }, [items])

  const pieData = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of expenseItems) {
      map.set(it.categoryName, (map.get(it.categoryName) ?? 0) + it.tx.amount)
    }
    return [...map].map(([name, value]) => ({ name, value }))
  }, [expenseItems])

  const dailyData = useMemo(() => {
    const days = Array.from({ length: daysInMonth(month) }, (_, i) => ({ day: i + 1, total: 0 }))
    for (const it of expenseItems) {
      const day = Number(it.tx.tx_date.slice(8, 10))
      if (days[day - 1]) days[day - 1].total += it.tx.amount
    }
    return days
  }, [expenseItems, month])

  const budgetRows = useMemo(() => {
    const limitCashflowIds = new Set(
      cat.cashflows.filter((cf) => cf.code === "spending" || cf.code === "bills").map((cf) => cf.id)
    )
    const budgetByCategory = new Map(bud.budgets.map((b) => [b.category_id, b.amount]))
    const actualByCategory = new Map<string, number>()
    for (const t of tx.transactions) {
      if (t.category_id) {
        actualByCategory.set(t.category_id, (actualByCategory.get(t.category_id) ?? 0) + t.amount)
      }
    }

    return cat.categories
      .filter((c) => limitCashflowIds.has(c.cashflow_id) && (budgetByCategory.get(c.id) ?? 0) > 0)
      .map((c) => ({
        name: c.name,
        budget: budgetByCategory.get(c.id) ?? 0,
        actual: actualByCategory.get(c.id) ?? 0,
      }))
  }, [cat.cashflows, cat.categories, bud.budgets, tx.transactions])

  const savingItems =
    sav.groups
      .find((g) => g.cf.code === "saving_invest")
      ?.pots.map((p) => {
        const s = sav.stats.get(p.id)
        return {
          id: p.id,
          name: p.name,
          value: s?.value ?? 0,
          gain: s?.gain ?? 0,
          configured: !!s?.configured,
        }
      }) ?? []

  const goalItems =
    sav.groups
      .find((g) => g.cf.code === "financial_goals")
      ?.pots.map((p) => {
        const s = sav.stats.get(p.id)
        return {
          id: p.id,
          name: p.name,
          value: s?.value ?? 0,
          target: p.target_amount,
          configured: !!s?.configured,
        }
      }) ?? []

  const loading = acc.loading || cat.loading || tx.loading || bud.loading || sav.loading || pf.loading
  const error = acc.error ?? cat.error ?? tx.error ?? bud.error ?? sav.error ?? pf.error

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackupReminder />
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <MonthNav month={month} onChange={setMonth} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Gagal memuat: {error}</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Saldo account</CardDescription>
                <CardTitle className="text-2xl">{formatRupiah(accountsTotal)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {cashAccounts.map((a) => (
                    <li key={a.id} className="flex justify-between gap-3">
                      <span className="truncate text-muted-foreground">{a.name}</span>
                      <span className={cn("shrink-0 tabular-nums", a.balance < 0 && "text-red-600")}>
                        {formatRupiah(a.balance)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Tabungan & goals</span>
                    <span className="tabular-nums">{formatRupiah(potsTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Portofolio saham</span>
                    <span className="tabular-nums">{formatRupiah(pf.portfolio.total)}</span>
                  </div>
                  <div className="flex justify-between gap-3 border-t pt-2 font-semibold">
                    <span>Total aset</span>
                    <span className="tabular-nums">{formatRupiah(totalAssets)}</span>
                  </div>
                  {pf.rdnId && (
                    <p className="text-xs text-muted-foreground">
                      Account RDN dihitung lewat Portofolio saham (nilai pasar + sisa cash), bukan
                      saldo transfernya.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:col-span-2">
              <StatCard label="Masuk" value={stats.income} className="text-green-600" />
              <StatCard label="Pengeluaran" hint="Spending + Bills" value={stats.expense} className="text-red-600" />
              <StatCard label="Disisihkan" hint="Saving/Invest + Goals (bersih)" value={stats.saved} className="text-blue-600" />
              <StatCard
                label="Selisih"
                hint="Masuk − Pengeluaran − Disisihkan"
                value={stats.net}
                className={stats.net < 0 ? "text-red-600" : undefined}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pengeluaran per kategori</CardTitle>
                <CardDescription>Spending + Bills</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpensePie data={pieData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pengeluaran harian</CardTitle>
                <CardDescription>Spending + Bills</CardDescription>
              </CardHeader>
              <CardContent>
                <DailyBars data={dailyData} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Perhatian budget</CardTitle>
                <CardDescription>Kategori yang sudah mencapai 80% atau lebih</CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetWatch rows={budgetRows} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaksi terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTransactions items={items.slice(0, 5)} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tabungan</CardTitle>
                <CardDescription>Saving/Invest</CardDescription>
              </CardHeader>
              <CardContent>
                <SavingsSummary items={savingItems} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress goals</CardTitle>
                <CardDescription>Financial Goals</CardDescription>
              </CardHeader>
              <CardContent>
                <GoalsProgress items={goalItems} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saham</CardTitle>
              <CardDescription>Nilai pasar mengikuti harga terakhir di jurnal saham</CardDescription>
            </CardHeader>
            <CardContent>
              <StocksCard portfolio={pf.portfolio} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: number
  hint?: string
  className?: string
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums sm:text-xl", className)}>
        {formatRupiah(value)}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}