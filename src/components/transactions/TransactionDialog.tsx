import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { todayISO } from "@/lib/date"
import type { TxItem } from "@/lib/transactions"
import type { AccountRow, CashflowRow, CategoryRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/CurrencyInput"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/OptionSelect"

type Kind = "income" | "spending" | "bills" | "saving_invest" | "financial_goals" | "transfer"

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: TxItem | null
  cashflows: CashflowRow[]
  categories: CategoryRow[]
  accounts: AccountRow[]
  onSaved: () => void
}

export function TransactionDialog({
  open,
  onOpenChange,
  item,
  cashflows,
  categories,
  accounts,
  onSaved,
}: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Ubah transaksi" : "Tambah transaksi"}</DialogTitle>
          <DialogDescription>Catat uang masuk, keluar, atau pindah antar account.</DialogDescription>
        </DialogHeader>
        <TransactionForm
          item={item}
          cashflows={cashflows}
          categories={categories}
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

type FormProps = {
  item: TxItem | null
  cashflows: CashflowRow[]
  categories: CategoryRow[]
  accounts: AccountRow[]
  onCancel: () => void
  onSaved: () => void
}

function TransactionForm({ item, cashflows, categories, accounts, onCancel, onSaved }: FormProps) {
  const tx = item?.tx ?? null
  const isTransferTx = !!tx && !tx.category_id

  const [kind, setKind] = useState<Kind>(
    item ? (item.cashflow ? (item.cashflow.code as Kind) : "transfer") : "spending"
  )
  const [date, setDate] = useState(tx?.tx_date ?? todayISO())
  const [categoryId, setCategoryId] = useState(tx?.category_id ?? "")
  const [description, setDescription] = useState(tx?.description ?? "")
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "")
  const [accountId, setAccountId] = useState(
    tx && !isTransferTx ? (tx.account_in_id ?? tx.account_out_id ?? "") : ""
  )
  const [fromId, setFromId] = useState(isTransferTx ? (tx?.account_out_id ?? "") : "")
  const [toId, setToId] = useState(isTransferTx ? (tx?.account_in_id ?? "") : "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const kindOptions = [
    ...cashflows.map((cf) => ({ code: cf.code as Kind, label: cf.label, color: cf.color })),
    { code: "transfer" as Kind, label: "Transfer", color: "#6b7280" },
  ]

  const currentCashflow = cashflows.find((c) => c.code === kind)
  const categoryOptions = categories.filter(
    (c) => c.cashflow_id === currentCashflow?.id && (!c.is_archived || c.id === tx?.category_id)
  )
  const ownAccountIds = [tx?.account_in_id, tx?.account_out_id]
  const accountOptions = accounts.filter((a) => !a.is_archived || ownAccountIds.includes(a.id))

  function changeKind(next: Kind) {
    setKind(next)
    setCategoryId("")
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const value = Number(amount || "0")
    if (!date) return setError("Tanggal wajib diisi.")
    if (value <= 0) return setError("Nominal harus lebih dari 0.")

    let accountsPart: {
      category_id: string | null
      account_in_id: string | null
      account_out_id: string | null
    }

    if (kind === "transfer") {
      if (!fromId || !toId) return setError("Pilih account asal dan tujuan.")
      if (fromId === toId) return setError("Account asal dan tujuan tidak boleh sama.")
      accountsPart = { category_id: null, account_in_id: toId, account_out_id: fromId }
    } else {
      if (!categoryId) return setError("Pilih kategori.")
      if (!accountId) return setError("Pilih account.")
      accountsPart = {
        category_id: categoryId,
        account_in_id: kind === "income" ? accountId : null,
        account_out_id: kind === "income" ? null : accountId,
      }
    }

    const body = { tx_date: date, description: description.trim(), amount: value, ...accountsPart }

    setSaving(true)
    const { error } = tx
      ? await supabase.from("transactions").update(body).eq("id", tx.id)
      : await supabase.from("transactions").insert(body)
    setSaving(false)

    if (error) return setError(error.message)
    onSaved()
  }

  async function handleDelete() {
    if (!tx || !window.confirm("Hapus transaksi ini?")) return
    setSaving(true)
    const { error } = await supabase.from("transactions").delete().eq("id", tx.id)
    setSaving(false)
    if (error) return setError(error.message)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Jenis</Label>
        <div className="flex flex-wrap gap-2">
          {kindOptions.map((k) => (
            <Button
              key={k.code}
              type="button"
              size="sm"
              variant={kind === k.code ? "default" : "outline"}
              className="gap-2"
              onClick={() => changeKind(k.code)}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: k.color ?? "#9ca3af" }}
              />
              {k.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-date">Tanggal</Label>
        <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {kind !== "transfer" && (
        <div className="space-y-2">
          <Label htmlFor="tx-category">Kategori</Label>
          <OptionSelect
            id="tx-category"
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Pilih kategori"
            options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tx-description">Keterangan</Label>
        <Input
          id="tx-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contoh: Makan siang"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-amount">Nominal (Rp)</Label>
        <CurrencyInput id="tx-amount" value={amount} onChange={setAmount} />
      </div>

      {kind === "transfer" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <AccountSelect id="tx-from" label="Dari account" value={fromId} onChange={setFromId} options={accountOptions} />
          <AccountSelect id="tx-to" label="Ke account" value={toId} onChange={setToId} options={accountOptions} />
        </div>
      ) : (
        <AccountSelect
          id="tx-account"
          label={kind === "income" ? "Masuk ke account (Transfer In)" : "Keluar dari account (Transfer Out)"}
          value={accountId}
          onChange={setAccountId}
          options={accountOptions}
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2 pt-2">
        {tx ? (
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

type AccountSelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: AccountRow[]
}

function AccountSelect({ id, label, value, onChange, options }: AccountSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <OptionSelect
        id={id}
        value={value}
        onChange={onChange}
        placeholder="Pilih account"
        options={options.map((a) => ({ value: a.id, label: a.name }))}
      />
    </div>
  )
}