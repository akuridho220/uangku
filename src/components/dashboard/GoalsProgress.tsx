import { Link } from "react-router-dom"
import { formatRupiah } from "@/lib/format"

export type GoalItem = {
  id: string
  name: string
  value: number
  target: number | null
  configured: boolean
}

export function GoalsProgress({ items }: { items: GoalItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Belum ada kategori Financial Goals.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {items.map((g) => {
          const pct =
            g.target && g.target > 0 ? Math.max(0, Math.min(100, (g.value / g.target) * 100)) : null

          return (
            <li key={g.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{g.name}</span>
                {pct !== null && g.configured && (
                  <span className="shrink-0 text-xs text-muted-foreground">{Math.round(pct)}%</span>
                )}
              </div>

              {pct !== null && g.configured && (
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {!g.configured
                  ? "Nilai awal belum diatur"
                  : g.target
                    ? `${formatRupiah(g.value)} dari ${formatRupiah(g.target)}`
                    : `${formatRupiah(g.value)} · belum ada target`}
              </p>
            </li>
          )
        })}
      </ul>

      <Link to="/tabungan" className="text-sm font-medium text-primary hover:underline">
        Kelola goals →
      </Link>
    </div>
  )
}