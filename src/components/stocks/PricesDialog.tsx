import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { todayISO } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import type { Position } from "@/lib/stocks"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/CurrencyInput"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  positions: Position[]
  onSaved: () => void
}

export function PricesDialog({ open, onOpenChange, positions, onSaved }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update harga</DialogTitle>
          <DialogDescription>Isi harga terakhir per lembar untuk setiap saham.</DialogDescription>
        </DialogHeader>
        <PricesForm
          positions={positions}
          onCancel={() => onOpenChange(false)}
          onSaved={() => {
            onOpenChange(false)
            onSaved()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function PricesForm({
  positions,
  onCancel,
  onSaved,
}: {
  positions: Position[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(todayISO())
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(positions.map((p) => [p.stock.id, p.price !== null ? String(p.price) : ""]))
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const changes = positions.filter((p) => {
      const v = Number(prices[p.stock.id] || "0")
      return v > 0 && v !== p.price
    })
    if (changes.length === 0) return onCancel()

    setSaving(true)
    const results = await Promise.all(
      changes.map((p) =>
        supabase
          .from("stocks")
          .update({
            price: Number(prices[p.stock.id]),
            price_date: date,
            price_updated_at: new Date().toISOString(),
          })
          .eq("id", p.stock.id)
      )
    )
    setSaving(false)

    const failed = results.find((r) => r.error)
    if (failed?.error) return setError(failed.error.message)
    onSaved()
  }

  if (positions.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada posisi aktif.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="price-date">Tanggal harga</Label>
        <Input id="price-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="space-y-3">
        {positions.map((p) => (
          <div key={p.stock.id} className="grid grid-cols-[5rem_1fr] items-center gap-3">
            <div>
              <p className="font-semibold">{p.stock.ticker}</p>
              <p className="text-xs text-muted-foreground">
                {p.price === null ? "–" : formatRupiah(p.price)}
              </p>
            </div>
            <CurrencyInput
              value={prices[p.stock.id] ?? ""}
              onChange={(v) => setPrices((prev) => ({ ...prev, [p.stock.id]: v }))}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  )
}