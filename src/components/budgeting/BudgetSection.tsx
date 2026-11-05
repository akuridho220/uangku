    import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format"
import type { CashflowRow, CategoryRow } from "@/types/db"
import { CurrencyInput } from "@/components/CurrencyInput"

export type Section = {
  cf: CashflowRow
  cats: CategoryRow[]
  budget: number
  actual: number
}

const ACTUAL_LABEL: Record<string, string> = {
  income: "Diterima",
  spending: "Terpakai",
  bills: "Terbayar",
  saving_invest: "Disisihkan",
  financial_goals: "Disisihkan",
}

type SectionProps = {
  section: Section
  budgetByCategory: Map<string, number>
  actualByCategory: Map<string, number>
  onSave: (categoryId: string, amount: number | null) => void
}

export function BudgetSection({ section, budgetByCategory, actualByCategory, onSave }: SectionProps) {
  const { cf, cats, budget, actual } = section
  // Spending dan Bills punya batas (jangan lewat); lainnya adalah target (capai).
  const isLimit = cf.code === "spending" || cf.code === "bills"

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: cf.color ?? "#9ca3af" }}
          />
          <h2 className="text-sm font-semibold">{cf.label}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatRupiah(actual)} / {formatRupiah(budget)}
        </p>
      </div>

      <div className="divide-y">
        {cats.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Belum ada kategori.</p>
        )}
        {cats.map((c) => {
          const b = budgetByCategory.get(c.id) ?? null
          return (
            <BudgetRow
              key={`${c.id}:${b ?? "none"}`}
              category={c}
              budget={b}
              actual={actualByCategory.get(c.id) ?? 0}
              isLimit={isLimit}
              actualLabel={ACTUAL_LABEL[cf.code] ?? "Realisasi"}
              onSave={onSave}
            />
          )
        })}
      </div>
    </section>
  )
}

type RowProps = {
  category: CategoryRow
  budget: number | null
  actual: number
  isLimit: boolean
  actualLabel: string
  onSave: (categoryId: string, amount: number | null) => void
}

function BudgetRow({ category, budget, actual, isLimit, actualLabel, onSave }: RowProps) {
  const [value, setValue] = useState(budget !== null ? String(budget) : "")

  const pct = budget && budget > 0 ? (actual / budget) * 100 : 0
  const remaining = (budget ?? 0) - actual
  const over = budget !== null && budget > 0 && actual > budget

  let barColor = "bg-primary"
  if (isLimit) barColor = over ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500"

  let rightText = "Belum ada budget"
  if (budget !== null) {
    if (isLimit) {
      rightText = over ? `Lebih ${formatRupiah(-remaining)}` : `Sisa ${formatRupiah(remaining)}`
    } else {
      rightText = remaining > 0 ? `Kurang ${formatRupiah(remaining)}` : "Tercapai"
    }
  }

  function commit() {
    const next = value === "" ? null : Number(value)
    if (next === budget) return
    onSave(category.id, next)
  }

  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">
          {category.name}
          {category.is_archived && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">(arsip)</span>
          )}
        </p>
        <div
          className="w-36 shrink-0"
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur()
          }}
        >
          <CurrencyInput value={value} onChange={setValue} placeholder="Budget" />
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {actualLabel} {formatRupiah(actual)}
        </span>
        <span className={cn(isLimit && over && "font-medium text-red-600")}>{rightText}</span>
      </div>
    </div>
  )
}