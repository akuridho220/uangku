import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format"

type Row = { name: string; budget: number; actual: number }

export function BudgetWatch({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Belum ada budget Spending/Bills bulan ini. Atur di menu Budgeting.
      </p>
    )
  }

  const watch = rows
    .map((r) => ({ ...r, pct: (r.actual / r.budget) * 100 }))
    .filter((r) => r.pct >= 80)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  if (watch.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Semua kategori masih di bawah 80% dari budget. 👍
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {watch.map((r) => {
        const over = r.pct > 100
        return (
          <li key={r.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{r.name}</span>
              <span className={cn("shrink-0 text-xs", over ? "font-medium text-red-600" : "text-amber-600")}>
                {Math.round(r.pct)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-amber-500")}
                style={{ width: `${Math.min(r.pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatRupiah(r.actual)} dari {formatRupiah(r.budget)}
            </p>
          </li>
        )
      })}
    </ul>
  )
}