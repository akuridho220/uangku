import { formatDateMedium } from "@/lib/date"
import { formatPercent, formatRupiah } from "@/lib/format"
import { SHARES_PER_LOT, dividendAmount, type Portfolio } from "@/lib/stocks"
import type { DividendRow, StockRow } from "@/types/db"

const perShareFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 })

type Props = {
  dividends: DividendRow[]
  stocks: StockRow[]
  portfolio: Portfolio
  onEdit: (dividend: DividendRow) => void
}

export function DividendSection({ dividends, stocks, portfolio, onEdit }: Props) {
  if (dividends.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Belum ada dividen tercatat.
      </p>
    )
  }

  const tickerById = new Map(stocks.map((s) => [s.id, s.ticker]))
  const avgByStock = new Map(portfolio.positions.map((p) => [p.stock.id, p.avgCost]))
  const years = [...new Set(dividends.map((d) => d.pay_date.slice(0, 4)))].sort().reverse()

  return (
    <div className="space-y-3">
      {years.map((year, i) => {
        const rows = dividends
          .filter((d) => d.pay_date.startsWith(year))
          .sort((a, b) => b.pay_date.localeCompare(a.pay_date))
        const total = rows.reduce((s, d) => s + dividendAmount(d), 0)

        return (
          <details key={year} open={i === 0} className="rounded-lg border">
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
              <span className="font-semibold">{year}</span>
              <span className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{rows.length} pembayaran</span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium tabular-nums text-green-600">
                  {formatRupiah(total)}
                </span>
              </span>
            </summary>

            <div className="overflow-x-auto border-t">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Tanggal</th>
                    <th className="px-3 py-3 text-left font-medium">Kode</th>
                    <th className="px-3 py-3 text-right font-medium">Lot</th>
                    <th className="px-3 py-3 text-right font-medium">Div/Saham</th>
                    <th className="px-3 py-3 text-right font-medium">Yield</th>
                    <th className="px-3 py-3 text-right font-medium">Total Dividen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((d) => {
                    const avg = avgByStock.get(d.stock_id)
                    return (
                      <tr
                        key={d.id}
                        onClick={() => onEdit(d)}
                        className="cursor-pointer hover:bg-muted/40"
                      >
                        <td className="whitespace-nowrap px-3 py-3">{formatDateMedium(d.pay_date)}</td>
                        <td className="px-3 py-3 font-semibold">{tickerById.get(d.stock_id) ?? "?"}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{d.lots}</td>
                        <td className="px-3 py-3 text-right tabular-nums">Rp{perShareFmt.format(d.per_share)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-green-600">
                          {avg ? formatPercent((d.per_share / avg) * 100) : "–"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-green-600">
                          {formatRupiah(d.lots * SHARES_PER_LOT * d.per_share)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-muted/30">
                    <td colSpan={5} className="px-3 py-3 text-right text-xs text-muted-foreground">
                      Total {year}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-green-600">
                      {formatRupiah(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        )
      })}
      <p className="text-xs text-muted-foreground">
        Yield dihitung terhadap harga rata-rata beli posisi yang masih aktif.
      </p>
    </div>
  )
}