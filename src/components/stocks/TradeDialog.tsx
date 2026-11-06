import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { todayISO } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { SHARES_PER_LOT, type Portfolio } from "@/lib/stocks"
import type { StockRow, TradeRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/CurrencyInput"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Side = "buy" | "sell"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade: TradeRow | null
  side: Side
  stocks: StockRow[]
  portfolio: Portfolio
  onSaved: () => void
}

export function TradeDialog({ open, onOpenChange, trade, side, stocks, portfolio, onSaved }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? "Ubah transaksi saham" : "Catat transaksi saham"}</DialogTitle>
          <DialogDescription>1 lot = 100 lembar.</DialogDescription>
        </DialogHeader>
        <TradeForm
          trade={trade}
          initialSide={side}
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
  trade: TradeRow | null
  initialSide: Side
  stocks: StockRow[]
  portfolio: Portfolio
  onCancel: () => void
  onSaved: () => void
}

function TradeForm({ trade, initialSide, stocks, portfolio, onCancel, onSaved }: FormProps) {
  const [side, setSide] = useState<Side>(trade?.side ?? initialSide)
  const [ticker, setTicker] = useState(
    trade ? (stocks.find((s) => s.id === trade.stock_id)?.ticker ?? "") : ""
  )
  const [date, setDate] = useState(trade?.trade_date ?? todayISO())
  const [lots, setLots] = useState(trade ? String(trade.lots) : "")
  const [price, setPrice] = useState(trade ? String(trade.price) : "")
  const [fee, setFee] = useState(trade && trade.fee ? String(trade.fee) : "")
  const [note, setNote] = useState(trade?.note ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const lotsNum = Number(lots || "0")
  const priceNum = Number(price || "0")
  const feeNum = Number(fee || "0")
  const gross = lotsNum * SHARES_PER_LOT * priceNum
  const net = side === "buy" ? gross + feeNum : gross - feeNum

  const code = ticker.trim().toUpperCase()
  const held = portfolio.positions.find((p) => p.stock.ticker === code)?.lots ?? 0
  const suggestions = side === "sell" ? portfolio.positions.map((p) => p.stock.ticker) : stocks.map((s) => s.ticker)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^[A-Z0-9]{2,8}$/.test(code)) return setError("Kode saham tidak valid (contoh: BBCA).")
    if (!date) return setError("Tanggal wajib diisi.")
    if (lotsNum <= 0) return setError("Jumlah lot harus lebih dari 0.")
    if (priceNum <= 0) return setError("Harga per lembar harus lebih dari 0.")
    if (side === "sell" && !trade && lotsNum > held) {
      return setError(`Kamu hanya memiliki ${held} lot ${code}.`)
    }

    setSaving(true)

    let stockId = stocks.find((s) => s.ticker === code)?.id
    if (!stockId) {
      if (side === "sell") {
        setSaving(false)
        return setError(`Saham ${code} belum pernah dibeli.`)
      }
      // saham baru: harga saat ini diisi dulu dengan harga beli
      const created = await supabase
        .from("stocks")
        .insert({ ticker: code, price: priceNum, price_date: date })
        .select("id")
        .single()
      if (created.error) {
        setSaving(false)
        return setError(created.error.message)
      }
      stockId = created.data.id as string
    }

    const body = {
      stock_id: stockId,
      side,
      trade_date: date,
      lots: lotsNum,
      price: priceNum,
      fee: feeNum,
      note: note.trim(),
    }

    const { error } = trade
      ? await supabase.from("stock_trades").update(body).eq("id", trade.id)
      : await supabase.from("stock_trades").insert(body)

    setSaving(false)
    if (error) return setError(error.message)
    onSaved()
  }

  async function handleDelete() {
    if (!trade || !window.confirm("Hapus transaksi saham ini?")) return
    setSaving(true)
    const { error } = await supabase.from("stock_trades").delete().eq("id", trade.id)
    setSaving(false)
    if (error) return setError(error.message)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={side === "buy" ? "default" : "outline"}
          onClick={() => setSide("buy")}
        >
          Beli
        </Button>
        <Button
          type="button"
          size="sm"
          variant={side === "sell" ? "default" : "outline"}
          onClick={() => setSide("sell")}
        >
          Jual
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trade-ticker">Kode saham</Label>
        <Input
          id="trade-ticker"
          list="trade-tickers"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Contoh: BBCA"
          autoComplete="off"
        />
        <datalist id="trade-tickers">
          {suggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        {side === "sell" && code && !trade && (
          <p className="text-xs text-muted-foreground">Dimiliki saat ini: {held} lot</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trade-date">Tanggal</Label>
          <Input id="trade-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trade-lots">Jumlah lot</Label>
          <Input
            id="trade-lots"
            inputMode="numeric"
            value={lots}
            onChange={(e) => setLots(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trade-price">Harga per lembar (Rp)</Label>
          <CurrencyInput id="trade-price" value={price} onChange={setPrice} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trade-fee">Biaya + pajak (Rp, opsional)</Label>
          <CurrencyInput id="trade-fee" value={fee} onChange={setFee} />
        </div>
      </div>

      {gross > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Nilai transaksi</span>
            <span className="tabular-nums">{formatRupiah(gross)}</span>
          </p>
          <p className="flex justify-between font-medium">
            <span>{side === "buy" ? "Total dibayar" : "Total diterima"}</span>
            <span className="tabular-nums">{formatRupiah(net)}</span>
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="trade-note">Catatan (opsional)</Label>
        <Input
          id="trade-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contoh: Take Profit"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2 pt-2">
        {trade ? (
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