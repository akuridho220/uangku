import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import type { AccountRow, StockSettings } from "@/types/db"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/CurrencyInput"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/OptionSelect"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: StockSettings
  accounts: AccountRow[]
  onSaved: () => void
}

export function SettingsDialog({ open, onOpenChange, settings, accounts, onSaved }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pengaturan saham</DialogTitle>
          <DialogDescription>Hubungkan account RDN dan isi modal awal.</DialogDescription>
        </DialogHeader>
        <SettingsForm
          settings={settings}
          accounts={accounts}
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

function SettingsForm({
  settings,
  accounts,
  onCancel,
  onSaved,
}: {
  settings: StockSettings
  accounts: AccountRow[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [accountId, setAccountId] = useState(settings.rdn_account_id ?? "")
  const [capital, setCapital] = useState(
    settings.opening_capital ? String(settings.opening_capital) : ""
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.from("stock_settings").upsert(
      { rdn_account_id: accountId || null, opening_capital: Number(capital || "0") },
      { onConflict: "user_id" }
    )

    setSaving(false)
    if (error) return setError(error.message)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rdn-account">Account RDN Saham</Label>
        <OptionSelect
          id="rdn-account"
          value={accountId}
          onChange={setAccountId}
          placeholder="Pilih account"
          options={accounts.filter((a) => !a.is_archived).map((a) => ({ value: a.id, label: a.name }))}
        />
        <p className="text-xs text-muted-foreground">
          Transfer antar account ke account ini di menu Transaksi dihitung sebagai deposit modal.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rdn-capital">Modal awal (Rp)</Label>
        <CurrencyInput id="rdn-capital" value={capital} onChange={setCapital} />
        <p className="text-xs text-muted-foreground">
          Modal yang sudah kamu setor ke sekuritas sebelum transfernya tercatat di menu Transaksi.
          Sesuaikan angka ini sampai Sisa Cash sama dengan di sekuritas.
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