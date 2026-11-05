import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { todayISO } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import type { PotStats } from "@/lib/savings"
import type { CategoryRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/CurrencyInput"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  category: CategoryRow | null
  stats: PotStats | null
  onClose: () => void
  onSaved: () => void
}

export function ValuationDialog({ category, stats, onClose, onSaved }: Props) {
  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update nilai</DialogTitle>
          <DialogDescription>{category?.name}</DialogDescription>
        </DialogHeader>
        {category && stats && (
          <ValuationForm
            category={category}
            stats={stats}
            onCancel={onClose}
            onSaved={() => {
              onClose()
              onSaved()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ValuationForm({
  category,
  stats,
  onCancel,
  onSaved,
}: {
  category: CategoryRow
  stats: PotStats
  onCancel: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date) return setError("Tanggal wajib diisi.")
    if (stats.startDate && date < stats.startDate) {
      return setError("Tanggal tidak boleh sebelum tanggal mulai tabungan.")
    }
    if (!value) return setError("Isi nilai investasi saat ini.")

    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from("valuations")
      .insert({ category_id: category.id, val_date: date, value: Number(value) })
    setSaving(false)

    if (error) return setError(error.message)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="val-date">Tanggal</Label>
        <Input id="val-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="val-value">Nilai investasi saat ini (Rp)</Label>
        <CurrencyInput id="val-value" value={value} onChange={setValue} />
        <p className="text-xs text-muted-foreground">
          Nilai menurut catatan saat ini: {formatRupiah(stats.value)}. Selisihnya dengan angka
          yang kamu isi akan dicatat sebagai hasil.
        </p>
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