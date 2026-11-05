import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { CashflowRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const COLOR_PRESETS = [
  "#16a34a",
  "#dc2626",
  "#ea580c",
  "#2563eb",
  "#7c3aed",
  "#0d9488",
  "#db2777",
  "#d97706",
  "#6b7280",
]

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashflow: CashflowRow | null
  onSaved: () => void
}

export function CashflowDialog({ open, onOpenChange, cashflow, onSaved }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah cashflow</DialogTitle>
          <DialogDescription>
            Tipe cashflow bersifat tetap. Kamu hanya bisa mengubah tampilannya.
          </DialogDescription>
        </DialogHeader>
        {cashflow && (
          <CashflowForm
            cashflow={cashflow}
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onOpenChange(false)
              onSaved()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type FormProps = {
  cashflow: CashflowRow
  onCancel: () => void
  onSaved: () => void
}

function CashflowForm({ cashflow, onCancel, onSaved }: FormProps) {
  const [label, setLabel] = useState(cashflow.label)
  const [description, setDescription] = useState(cashflow.description ?? "")
  const [color, setColor] = useState(cashflow.color ?? COLOR_PRESETS[0])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) {
      setError("Label wajib diisi.")
      return
    }

    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from("cashflows")
      .update({ label: trimmed, description: description.trim() || null, color })
      .eq("id", cashflow.id)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cashflow-label">Label</Label>
        <Input
          id="cashflow-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cashflow-description">Deskripsi</Label>
        <Textarea
          id="cashflow-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Warna</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Warna ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                "size-8 rounded-full border-2 transition",
                color === c ? "border-foreground" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  )
}