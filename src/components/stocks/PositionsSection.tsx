import { formatDateMedium } from "@/lib/date"
import { formatPercent, formatRupiah } from "@/lib/format"
import type { Position } from "@/lib/stocks"
import { cn } from "@/lib/utils"

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatRupiah(n)}`
const tone = (n: number) => (n > 0 ? "text-green-600" : n < 0 ? "text-red-600" : "")

export function PositionsSection({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Belum ada posisi aktif. Tekan Beli untuk mencatat pembelian pertama.
      </p>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left font-medium">Kode</th>
              <th className="px-3 py-3 text-right font-medium">Lot</th>
              <th className="px-3 py-3 text-right font-medium">Avg Beli</th>
              <th className="px-3 py-3 text-right font-medium">Harga Beli</th>
              <th className="px-3 py-3 text-right font-medium">Harga Kini</th>
              <th className="px-3 py-3 text-right font-medium">Nilai Pasar</th>
              <th className="px-3 py-3 text-right font-medium">Floating (Rp)</th>
              <th className="px-3 py-3 text-right font-medium">Floating (%)</th>
              <th className="px-3 py-3 text-right font-medium">Alokasi</th>
              <th className="px-3 py-3 text-right font-medium">Akum. Dividen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {positions.map((p) => (
              <tr key={p.stock.id}>
                <td className="px-3 py-3">
                  <p className="font-semibold">{p.stock.ticker}</p>
                  <p className="text-xs text-muted-foreground">
                    sejak {formatDateMedium(p.openDate)} · {p.buyCount}× beli
                  </p>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{p.lots}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(p.avgCost)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(p.cost)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {p.price === null ? "–" : formatRupiah(p.price)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(p.marketValue)}</td>
                <td className={cn("px-3 py-3 text-right tabular-nums", tone(p.floating))}>
                  {signed(p.floating)}
                </td>
                <td className={cn("px-3 py-3 text-right tabular-nums", tone(p.floating))}>
                  {p.floatingPct === null ? "–" : formatPercent(p.floatingPct)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{p.allocation.toFixed(1)}%</td>
                <td className="px-3 py-3 text-right tabular-nums text-green-600">
                  {formatRupiah(p.dividends)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {positions.map((p) => (
          <div key={p.stock.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{p.stock.ticker}</p>
                <p className="text-xs text-muted-foreground">
                  sejak {formatDateMedium(p.openDate)} · {p.buyCount}× beli
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{formatRupiah(p.marketValue)}</p>
                <p className={cn("text-xs tabular-nums", tone(p.floating))}>
                  {signed(p.floating)}
                  {p.floatingPct !== null && ` (${formatPercent(p.floatingPct)})`}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
              <Item label="Lot" value={String(p.lots)} />
              <Item label="Avg beli" value={formatRupiah(p.avgCost)} />
              <Item label="Harga kini" value={p.price === null ? "–" : formatRupiah(p.price)} />
              <Item label="Harga beli" value={formatRupiah(p.cost)} />
              <Item label="Alokasi" value={`${p.allocation.toFixed(1)}%`} />
              <Item label="Dividen" value={formatRupiah(p.dividends)} />
            </dl>
          </div>
        ))}
      </div>
    </>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}