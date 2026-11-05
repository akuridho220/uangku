import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import type { CashflowRow, CategoryRow } from "@/types/db"
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
import { CurrencyInput } from "@/components/CurrencyInput"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashflow: CashflowRow | undefined
  category: CategoryRow | null
  nextSortOrder: number
  onSaved: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  cashflow,
  category,
  nextSortOrder,
  onSaved,
}: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Ubah kategori" : "Tambah kategori"}</DialogTitle>
          <DialogDescription>Cashflow: {cashflow?.label}</DialogDescription>
        </DialogHeader>
        {cashflow && (
          <CategoryForm
            cashflow={cashflow}
            category={category}
            nextSortOrder={nextSortOrder}
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
  category: CategoryRow | null
  nextSortOrder: number
  onCancel: () => void
  onSaved: () => void
}

function CategoryForm({ cashflow, category, nextSortOrder, onCancel, onSaved }: FormProps) {
  const isGoal = cashflow.code === "financial_goals"
  const [name, setName] = useState(category?.name ?? "")
  const [target, setTarget] = useState(
    category?.target_amount ? String(category.target_amount) : ""
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Nama kategori wajib diisi.")
      return
    }

    setSaving(true)
    setError(null)
    const payload = {
      name: trimmed,
      target_amount: isGoal && target ? Number(target) : null,
    }

    const { error } = category
      ? await supabase.from("categories").update(payload).eq("id", category.id)
      : await supabase
          .from("categories")
          .insert({ ...payload, cashflow_id: cashflow.id, sort_order: nextSortOrder })

    setSaving(false)
    if (error) {
      setError(
        error.code === "23505" ? "Nama kategori sudah ada di cashflow ini." : error.message
      )
      return
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Nama kategori</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      {isGoal && (
        <div className="space-y-2">
          <Label htmlFor="category-target">Target nominal (Rp)</Label>
          <CurrencyInput id="category-target" value={target} onChange={setTarget} />
          <p className="text-xs text-muted-foreground">Opsional. Dipakai untuk progress goal.</p>
        </div>
      )}

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