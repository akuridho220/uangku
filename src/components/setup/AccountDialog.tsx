import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import type { AccountRow } from "@/types/db"
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

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountRow | null
  nextSortOrder: number
  onSaved: () => void
}

export function AccountDialog({ open, onOpenChange, account, nextSortOrder, onSaved }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Ubah account" : "Tambah account"}</DialogTitle>
          <DialogDescription>
            Account adalah tempat uangmu berada: rekening bank, e-wallet, atau tunai.
          </DialogDescription>
        </DialogHeader>
        <AccountForm
          account={account}
          nextSortOrder={nextSortOrder}
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
  account: AccountRow | null
  nextSortOrder: number
  onCancel: () => void
  onSaved: () => void
}

function AccountForm({ account, nextSortOrder, onCancel, onSaved }: FormProps) {
  const [name, setName] = useState(account?.name ?? "")
  const [digits, setDigits] = useState(account ? String(account.opening_balance) : "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Nama account wajib diisi.")
      return
    }

    setSaving(true)
    setError(null)
    const opening_balance = Number(digits || "0")

    const { error } = account
      ? await supabase.from("accounts").update({ name: trimmed, opening_balance }).eq("id", account.id)
      : await supabase.from("accounts").insert({ name: trimmed, opening_balance, sort_order: nextSortOrder })

    setSaving(false)
    if (error) {
      setError(error.code === "23505" ? "Nama account sudah dipakai." : error.message)
      return
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="account-name">Nama account</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Livin Mandiri"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-balance">Saldo awal (Rp)</Label>
        <Input
          id="account-balance"
          inputMode="numeric"
          placeholder="0"
          value={digits ? Number(digits).toLocaleString("id-ID") : ""}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
        />
        <p className="text-xs text-muted-foreground">
          Saldo saat ini = saldo awal + semua uang masuk − semua uang keluar.
        </p>
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