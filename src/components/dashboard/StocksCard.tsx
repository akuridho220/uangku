import { Link } from "react-router-dom"
import { formatPercent, formatRupiah } from "@/lib/format"
import type { Portfolio } from "@/lib/stocks"
import { cn } from "@/lib/utils"

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatRupiah(n)}`
const tone = (n: number) => (n > 0 ? "text-green-600" : n < 0 ? "text-red-600" : "")

export function StocksCard({ portfolio: p }: { portfolio: Portfolio }) {
  const link = (
    <Link to="/tabungan?tab=saham" className="text-sm font-medium text-primary hover:underline">
      Buka jurnal saham →
    </Link>
  )

  if (p.positions.length === 0 && p.total === 0) {
    return (
      <div className="space-y-3">
        <p className="py-4 text-center text-sm text-muted-foreground">
          Belum ada saham. Catat pembelian pertama di jurnal saham.
        </p>
        {link}
      </div>
    )
  }

  const stats = [
    { label: "Total portofolio", value: formatRupiah(p.total) },
    { label: "Nilai pasar", value: formatRupiah(p.marketValue) },
    {
      label: "Floating P/L",
      value: signed(p.floating),
      sub: p.floatingPct === null ? undefined : formatPercent(p.floatingPct),
      tone: p.floating,
    },
    { label: "Sisa cash", value: formatRupiah(p.cash) },
  ]

  const top = [...p.positions].sort((a, b) => b.marketValue - a.marketValue).slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-sm font-semibold tabular-nums sm:text-base", s.tone !== undefined && tone(s.tone))}>
                {s.value}
              </p>
              {s.sub && (
                <p className={cn("text-xs tabular-nums", s.tone !== undefined && tone(s.tone))}>
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        <ul className="divide-y text-sm">
          {top.map((pos) => (
            <li key={pos.stock.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold">{pos.stock.ticker}</p>
                <p className="text-xs text-muted-foreground">{pos.allocation.toFixed(1)}% alokasi</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums">{formatRupiah(pos.marketValue)}</p>
                <p className={cn("text-xs tabular-nums", tone(pos.floating))}>
                  {pos.floatingPct === null ? "–" : formatPercent(pos.floatingPct)}
                </p>
              </div>
            </li>
          ))}
          {top.length === 0 && (
            <li className="py-2.5 text-muted-foreground">Belum ada posisi aktif.</li>
          )}
        </ul>
      </div>

      {link}
    </div>
  )
}