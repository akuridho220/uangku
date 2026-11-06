import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { todayISO } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { SHARES_PER_LOT, type Portfolio } from "@/lib/stocks"
import type { DividendRow, StockRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/OptionSelect"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dividend: DividendRow | null
  stocks: StockRow[]
  portfolio: Portfolio
  onSaved: () => void
}

export function DividendDialog({
  open,
  onOpenChange,
  dividend,
  stocks,
  portfolio,
  onSaved,
}: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dividend ? "Ubah dividen" : "Catat dividen"}</DialogTitle>
          <DialogDescription>Dividen yang masuk ke RDN menambah Sisa Cash.</DialogDescription>
        </DialogHeader>
        <DividendForm
          dividend={dividend}
          stocks={stocks}
          portfolio={portfolio}
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

type FormProps = {
  dividend: DividendRow | null
  stocks: StockRow[]
  portfolio: Portfolio
  onCancel: () => void
  onSaved: () => void
}

function DividendForm({ dividend, stocks, portfolio, onCancel, onSaved }: FormProps) {
  const [stockId, setStockId] = useState(dividend?.stock_id ?? "")
  const [date, setDate] = useState(dividend?.pay_date ?? todayISO())
  const [lots, setLots] = useState(dividend ? String(dividend.lots) : "")
  const [lotsEdited, setLotsEdited] = useState(!!dividend)
  const [perShare, setPerShare] = useState(dividend ? String(dividend.per_share) : "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const lotsNum = Number(lots || "0")
  const perShareNum = Number(perShare || "0")
  const total = lotsNum * SHARES_PER_LOT * perShareNum

  function pickStock(id: string) {
    setStockId(id)
    if (!lotsEdited) {
      // isi otomatis dengan jumlah lot yang sedang dimiliki
      const held = portfolio.positions.find((p) => p.stock.id === id)?.lots
      setLots(held ? String(held) : "")
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!stockId) return setError("Pilih saham.")
    if (!date) return setError("Tanggal wajib diisi.")
    if (lotsNum <= 0) return setError("Jumlah lot harus lebih dari 0.")
    if (perShareNum <= 0) return setError("Dividen per lembar harus lebih dari 0.")

    setSaving(true)
    const body = { stock_id: stockId, pay_date: date, lots: lotsNum, per_share: perShareNum }
    const { error } = dividend
      ? await supabase.from("stock_dividends").update(body).eq("id", dividend.id)
      : await supabase.from("stock_dividends").insert(body)
    setSaving(false)

    if (error) return setError(error.message)
    onSaved()
  }

  async function handleDelete() {
    if (!dividend || !window.confirm("Hapus catatan dividen ini?")) return
    setSaving(true)
    const { error } = await supabase.from("stock_dividends").delete().eq("id", dividend.id)
    setSaving(false)
    if (error) return setError(error.message)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="div-stock">Saham</Label>
        <OptionSelect
          id="div-stock"
          value={stockId}
          onChange={pickStock}
          placeholder="Pilih saham"
          options={stocks.map((s) => ({ value: s.id, label: s.ticker }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="div-date">Tanggal diterima</Label>
        <Input id="div-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="div-lots">Jumlah lot</Label>
          <Input
            id="div-lots"
            inputMode="numeric"
            value={lots}
            onChange={(e) => {
              setLots(e.target.value.replace(/\D/g, ""))
              setLotsEdited(true)
            }}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="div-per-share">Dividen per lembar (Rp)</Label>
          <Input
            id="div-per-share"
            inputMode="decimal"
            value={perShare}
            onChange={(e) => setPerShare(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""))}
            placeholder="0"
          />
        </div>
      </div>

      {total > 0 && (
        <p className="flex justify-between rounded-lg bg-muted/50 p-3 text-sm font-medium">
          <span>Total dividen</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2 pt-2">
        {dividend ? (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={saving}>
            Hapus
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </div>
    </form>
  )
}