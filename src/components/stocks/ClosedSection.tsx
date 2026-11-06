import { formatDateMedium } from "@/lib/date"
import { formatPercent, formatRupiah } from "@/lib/format"
import type { ClosedTrade } from "@/lib/stocks"
import { cn } from "@/lib/utils"

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatRupiah(n)}`
const tone = (n: number) => (n > 0 ? "text-green-600" : n < 0 ? "text-red-600" : "")

export function ClosedSection({ closed }: { closed: ClosedTrade[] }) {
  if (closed.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Belum ada saham yang dijual.
      </p>
    )
  }

  const years = [...new Set(closed.map((c) => c.sellDate.slice(0, 4)))].sort().reverse()

  return (
    <div className="space-y-3">
      {years.map((year, i) => {
        const rows = closed
          .filter((c) => c.sellDate.startsWith(year))
          .sort((a, b) => b.sellDate.localeCompare(a.sellDate))
        const total = rows.reduce((s, r) => s + r.gain, 0)

        return (
          <details key={year} open={i === 0} className="rounded-lg border">
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
              <span className="font-semibold">{year}</span>
              <span className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{rows.length} transaksi</span>
                <span className={cn("rounded-full bg-muted px-2 py-0.5 font-medium tabular-nums", tone(total))}>
                  {signed(total)}
                </span>
              </span>
            </summary>

            {/* Laptop */}
            <div className="hidden overflow-x-auto border-t md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Kode</th>
                    <th className="px-3 py-3 text-left font-medium">Beli</th>
                    <th className="px-3 py-3 text-left font-medium">Jual</th>
                    <th className="px-3 py-3 text-right font-medium">Hari</th>
                    <th className="px-3 py-3 text-right font-medium">Lot</th>
                    <th className="px-3 py-3 text-right font-medium">Nilai Beli</th>
                    <th className="px-3 py-3 text-right font-medium">Nilai Jual</th>
                    <th className="px-3 py-3 text-right font-medium">Avg Beli/Lbr</th>
                    <th className="px-3 py-3 text-right font-medium">Avg Jual/Lbr</th>
                    <th className="px-3 py-3 text-right font-medium">Gain/Loss</th>
                    <th className="px-3 py-3 text-right font-medium">Δ</th>
                    <th className="px-3 py-3 text-left font-medium">Ket.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-3 font-semibold">{r.stock.ticker}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDateMedium(r.openDate)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDateMedium(r.sellDate)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.days}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.lots}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(r.cost)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(r.proceeds)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(r.avgBuy)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(r.avgSell)}</td>
                      <td className={cn("px-3 py-3 text-right tabular-nums", tone(r.gain))}>
                        {formatRupiah(r.gain)}
                      </td>
                      <td className={cn("px-3 py-3 text-right tabular-nums", tone(r.gain))}>
                        {r.pct === null ? "–" : formatPercent(r.pct)}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{r.note}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <td colSpan={9} className="px-3 py-3 text-right text-xs text-muted-foreground">
                      Total {year}
                    </td>
                    <td className={cn("px-3 py-3 text-right font-semibold tabular-nums", tone(total))}>
                      {formatRupiah(total)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* HP */}
            <div className="space-y-3 border-t p-3 md:hidden">
              {rows.map((r) => (
                <div key={r.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.stock.ticker}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateMedium(r.openDate)} → {formatDateMedium(r.sellDate)} · {r.days} hari
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-semibold tabular-nums", tone(r.gain))}>{signed(r.gain)}</p>
                      <p className={cn("text-xs tabular-nums", tone(r.gain))}>
                        {r.pct === null ? "–" : formatPercent(r.pct)}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Lot</dt>
                      <dd className="font-medium tabular-nums">{r.lots}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nilai beli</dt>
                      <dd className="font-medium tabular-nums">{formatRupiah(r.cost)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nilai jual</dt>
                      <dd className="font-medium tabular-nums">{formatRupiah(r.proceeds)}</dd>
                    </div>
                  </dl>
                  {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                </div>
              ))}
            </div>
          </details>
        )
      })}
    </div>
  )
}