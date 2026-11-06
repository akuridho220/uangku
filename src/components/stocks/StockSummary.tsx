import { formatPercent, formatRupiah } from "@/lib/format"
import type { Portfolio } from "@/lib/stocks"
import { cn } from "@/lib/utils"

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatRupiah(n)}`

type Card = { label: string; value: string; sub?: string; tone?: number }

export function StockSummary({ portfolio: p }: { portfolio: Portfolio }) {
  const cards: Card[] = [
    { label: "Total Invested", value: formatRupiah(p.invested) },
    { label: "Nilai Pasar", value: formatRupiah(p.marketValue) },
    {
      label: "Floating P/L",
      value: signed(p.floating),
      sub: p.floatingPct === null ? undefined : formatPercent(p.floatingPct),
      tone: p.floating,
    },
    { label: "Akumulasi Dividen", value: formatRupiah(p.dividendsTotal), tone: p.dividendsTotal },
    { label: "Sisa Cash", value: formatRupiah(p.cash) },
    { label: "Modal Disetor", value: formatRupiah(p.capital) },
    { label: "Total Portofolio", value: formatRupiah(p.total) },
    {
      label: "Total P/L vs Modal",
      value: signed(p.totalPL),
      sub: p.totalPLPct === null ? undefined : formatPercent(p.totalPLPct),
      tone: p.totalPL,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p
            className={cn(
              "mt-1 text-sm font-semibold tabular-nums sm:text-lg",
              c.tone !== undefined && c.tone > 0 && "text-green-600",
              c.tone !== undefined && c.tone < 0 && "text-red-600"
            )}
          >
            {c.value}
          </p>
          {c.sub && (
            <p
              className={cn(
                "text-xs tabular-nums",
                c.tone && c.tone > 0 && "text-green-600",
                c.tone && c.tone < 0 && "text-red-600"
              )}
            >
              {c.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}