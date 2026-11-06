import { formatDateMedium } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { SHARES_PER_LOT } from "@/lib/stocks"
import { cn } from "@/lib/utils"
import type { StockRow, TradeRow } from "@/types/db"

type Props = {
  trades: TradeRow[]
  stocks: StockRow[]
  onEdit: (trade: TradeRow) => void
}

export function TradeLog({ trades, stocks, onEdit }: Props) {
  const tickerById = new Map(stocks.map((s) => [s.id, s.ticker]))
  const rows = [...trades].reverse() // terbaru di atas

  return (
    <details className="rounded-lg border">
      <summary className="cursor-pointer p-4 text-sm font-medium">
        Riwayat transaksi saham ({trades.length})
      </summary>
      {rows.length === 0 ? (
        <p className="border-t p-4 text-sm text-muted-foreground">Belum ada transaksi.</p>
      ) : (
        <ul className="divide-y border-t">
          {rows.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onEdit(t)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left text-sm hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        t.side === "buy" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                      )}
                    >
                      {t.side === "buy" ? "Beli" : "Jual"}
                    </span>
                    <span className="font-semibold">{tickerById.get(t.stock_id) ?? "?"}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateMedium(t.trade_date)} · {t.lots} lot × {formatRupiah(t.price)}
                    {t.fee > 0 && ` · biaya ${formatRupiah(t.fee)}`}
                    {t.note && ` · ${t.note}`}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums">
                  {formatRupiah(t.lots * SHARES_PER_LOT * t.price)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}