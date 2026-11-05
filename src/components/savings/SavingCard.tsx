import { useState } from "react"
import { Settings2, Trash2 } from "lucide-react"
import { formatDateShort } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import type { PotStats } from "@/lib/savings"
import { cn } from "@/lib/utils"
import type { CategoryRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  category: CategoryRow
  stats: PotStats
  onDeposit: () => void
  onWithdraw: () => void
  onUpdateValue: () => void
  onSetOpening: () => void
  onDeleteValuation: (id: string) => void
}

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatRupiah(n)}`
const gainColor = (n: number) => (n > 0 ? "text-green-600" : n < 0 ? "text-red-600" : "")

export function SavingCard({
  category,
  stats,
  onDeposit,
  onWithdraw,
  onUpdateValue,
  onSetOpening,
  onDeleteValuation,
}: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const target = category.target_amount
  const progress =
    target && target > 0 ? Math.max(0, Math.min(100, (stats.value / target) * 100)) : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{category.name}</CardTitle>
            {stats.configured && stats.startDate && (
              <CardDescription>Dimulai {formatDateShort(stats.startDate)}</CardDescription>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onSetOpening} aria-label="Atur nilai awal">
            <Settings2 className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!stats.configured ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nilai awal belum diatur. Atur dulu agar nilai dan keuntungan bisa dihitung.
            </p>
            <Button onClick={onSetOpening}>Atur nilai awal</Button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Nilai sekarang (perkiraan)</p>
              <p className="text-2xl font-semibold tabular-nums">{formatRupiah(stats.value)}</p>
              <p className="text-xs text-muted-foreground">
                {stats.lastValuationDate
                  ? `Update nilai terakhir ${formatDateShort(stats.lastValuationDate)}`
                  : "Belum ada update nilai"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Modal</p>
                <p className="font-medium tabular-nums">{formatRupiah(stats.capital)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Keuntungan</p>
                <p className={cn("font-medium tabular-nums", gainColor(stats.gain))}>
                  {signed(stats.gain)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Imbal hasil</p>
                <p className={cn("font-medium tabular-nums", gainColor(stats.gain))}>
                  {stats.gainPct === null
                    ? "–"
                    : `${stats.gainPct > 0 ? "+" : ""}${stats.gainPct.toFixed(2)}%`}
                </p>
              </div>
            </div>

            {progress !== null && target && (
              <div className="space-y-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% dari target {formatRupiah(target)}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onDeposit}>
                Setor
              </Button>
              <Button size="sm" variant="outline" onClick={onWithdraw}>
                Cairkan
              </Button>
              <Button size="sm" variant="outline" onClick={onUpdateValue}>
                Update nilai
              </Button>
            </div>

            {stats.history.length > 0 && (
              <div className="space-y-2">
                <Button variant="ghost" size="sm" onClick={() => setShowHistory((v) => !v)}>
                  {showHistory ? "Sembunyikan" : "Lihat"} riwayat nilai ({stats.history.length})
                </Button>
                {showHistory && (
                  <ul className="divide-y rounded-lg border text-sm">
                    {[...stats.history].reverse().map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="font-medium tabular-nums">{formatRupiah(h.value)}</p>
                          <p className="text-xs text-muted-foreground">{formatDateShort(h.date)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={cn("tabular-nums", gainColor(h.gain))}>
                            Hasil {signed(h.gain)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteValuation(h.id)}
                            aria-label="Hapus update nilai"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}