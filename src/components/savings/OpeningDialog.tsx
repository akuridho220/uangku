import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { todayISO } from "@/lib/date"
import type { CategoryRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/CurrencyInput"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  category: CategoryRow | null
  onClose: () => void
  onSaved: () => void
}

export function OpeningDialog({ category, onClose, onSaved }: Props) {
  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atur nilai awal</DialogTitle>
          <DialogDescription>{category?.name}</DialogDescription>
        </DialogHeader>
        {category && (
          <OpeningForm
            category={category}
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

function OpeningForm({
  category,
  onCancel,
  onSaved,
}: {
  category: CategoryRow
  onCancel: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(category.start_date ?? todayISO())
  const [value, setValue] = useState(category.opening_value ? String(category.opening_value) : "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date) return setError("Tanggal mulai wajib diisi.")

    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from("categories")
      .update({ start_date: date, opening_value: Number(value || "0") })
      .eq("id", category.id)
    setSaving(false)

    if (error) return setError(error.message)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="open-date">Tanggal mulai</Label>
        <Input id="open-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="open-value">Nilai awal (Rp)</Label>
        <CurrencyInput id="open-value" value={value} onChange={setValue} />
        <p className="text-xs text-muted-foreground">
          Isi dengan nilai tabungan ini pada tanggal mulai (lihat di aplikasi reksa dananya).
          Transaksi pada tanggal mulai dianggap sudah termasuk; hanya setoran dan pencairan
          setelahnya yang dihitung.
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