import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAccounts } from "@/hooks/useAccounts"
import { useCategories } from "@/hooks/useCategories"
import { useSavingData } from "@/hooks/useSavingData"
import { formatRupiah } from "@/lib/format"
import { computePot, type PotStats } from "@/lib/savings"
import { cn } from "@/lib/utils"
import type { CategoryRow } from "@/types/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OpeningDialog } from "@/components/savings/OpeningDialog"
import { SavingCard } from "@/components/savings/SavingCard"
import { ValuationDialog } from "@/components/savings/ValuationDialog"
import {
  TransactionDialog,
  type TransactionPreset,
} from "@/components/transactions/TransactionDialog"

export default function SavingsPage() {
  const acc = useAccounts()
  const cat = useCategories()

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

  const [txOpen, setTxOpen] = useState(false)
  const [preset, setPreset] = useState<TransactionPreset | null>(null)
  const [openingFor, setOpeningFor] = useState<CategoryRow | null>(null)
  const [valuationFor, setValuationFor] = useState<CategoryRow | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openTx(pot: CategoryRow, isGoal: boolean, direction: "deposit" | "withdraw") {
    setPreset({
      kind: isGoal ? "financial_goals" : "saving_invest",
      categoryId: pot.id,
      direction,
    })
    setTxOpen(true)
  }

  async function reloadAll() {
    await Promise.all([cat.refresh(), data.refresh()])
  }

  async function deleteValuation(id: string) {
    if (!window.confirm("Hapus update nilai ini?")) return
    setActionError(null)
    const { error } = await supabase.from("valuations").delete().eq("id", id)
    if (error) setActionError(error.message)
    else await data.refresh()
  }

  const loading = acc.loading || cat.loading || data.loading
  const error = acc.error ?? cat.error ?? data.error

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Tabungan</h1>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Gagal memuat: {error}</p>
      ) : (
        <Tabs defaultValue={groups[0]?.cf.code}>
          <TabsList>
            {groups.map((g) => (
              <TabsTrigger key={g.cf.id} value={g.cf.code}>
                {g.cf.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {groups.map((g) => {
            const isGoal = g.cf.code === "financial_goals"
            const configured = g.pots.map((p) => stats.get(p.id)).filter((s) => s?.configured)
            const totalValue = configured.reduce((s, x) => s + (x?.value ?? 0), 0)
            const totalGain = configured.reduce((s, x) => s + (x?.gain ?? 0), 0)

            return (
              <TabsContent key={g.cf.id} value={g.cf.code} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total nilai</p>
                    <p className="mt-1 font-semibold tabular-nums">{formatRupiah(totalValue)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total keuntungan</p>
                    <p
                      className={cn(
                        "mt-1 font-semibold tabular-nums",
                        totalGain > 0 && "text-green-600",
                        totalGain < 0 && "text-red-600"
                      )}
                    >
                      {totalGain > 0 ? "+" : ""}
                      {formatRupiah(totalGain)}
                    </p>
                  </div>
                </div>

                {g.pots.length === 0 && (
                  <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                    Belum ada kategori. Tambahkan di Set Up → Kategori.
                  </p>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  {g.pots.map((p) => {
                    const s = stats.get(p.id)
                    if (!s) return null
                    return (
                      <SavingCard
                        key={p.id}
                        category={p}
                        stats={s}
                        onDeposit={() => openTx(p, isGoal, "deposit")}
                        onWithdraw={() => openTx(p, isGoal, "withdraw")}
                        onUpdateValue={() => setValuationFor(p)}
                        onSetOpening={() => setOpeningFor(p)}
                        onDeleteValuation={deleteValuation}
                      />
                    )
                  })}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      <TransactionDialog
        open={txOpen}
        onOpenChange={setTxOpen}
        item={null}
        preset={preset}
        cashflows={cat.cashflows}
        categories={cat.categories}
        accounts={acc.accounts}
        onSaved={data.refresh}
      />

      <OpeningDialog
        category={openingFor}
        onClose={() => setOpeningFor(null)}
        onSaved={reloadAll}
      />

      <ValuationDialog
        category={valuationFor}
        stats={valuationFor ? (stats.get(valuationFor.id) ?? null) : null}
        onClose={() => setValuationFor(null)}
        onSaved={data.refresh}
      />
    </div>
  )
}