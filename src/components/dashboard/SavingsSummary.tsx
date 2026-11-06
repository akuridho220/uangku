import { Link } from "react-router-dom"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

export type SavingItem = {
  id: string
  name: string
  value: number
  gain: number
  configured: boolean
}

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatRupiah(n)}`
const gainColor = (n: number) => (n > 0 ? "text-green-600" : n < 0 ? "text-red-600" : "text-muted-foreground")

export function SavingsSummary({ items }: { items: SavingItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Belum ada kategori Saving/Invest.
      </p>
    )
  }

  const configured = items.filter((i) => i.configured)
  const totalValue = configured.reduce((s, i) => s + i.value, 0)
  const totalGain = configured.reduce((s, i) => s + i.gain, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Total nilai</p>
          <p className="text-xl font-semibold tabular-nums">{formatRupiah(totalValue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total keuntungan</p>
          <p className={cn("text-xl font-semibold tabular-nums", gainColor(totalGain))}>
            {signed(totalGain)}
          </p>
        </div>
      </div>

      <ul className="divide-y text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="truncate">{i.name}</span>
            {i.configured ? (
              <div className="shrink-0 text-right">
                <p className="tabular-nums">{formatRupiah(i.value)}</p>
                <p className={cn("text-xs tabular-nums", gainColor(i.gain))}>{signed(i.gain)}</p>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Belum diatur</span>
            )}
          </li>
        ))}
      </ul>

      <Link to="/tabungan" className="text-sm font-medium text-primary hover:underline">
        Kelola tabungan →
      </Link>
    </div>
  )
}