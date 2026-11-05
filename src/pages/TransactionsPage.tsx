import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useAccounts } from "@/hooks/useAccounts"
import { useCategories } from "@/hooks/useCategories"
import { useTransactions } from "@/hooks/useTransactions"
import { currentMonthKey, formatMonthLabel, shiftMonth } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { buildItems, type TxItem } from "@/lib/transactions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TransactionCards } from "@/components/transactions/TransactionCards"
import { TransactionDialog } from "@/components/transactions/TransactionDialog"
import { TransactionTable } from "@/components/transactions/TransactionTable"

export default function TransactionsPage() {
  const [month, setMonth] = useState(currentMonthKey())
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TxItem | null>(null)

  const tx = useTransactions(month)
  const acc = useAccounts()
  const cat = useCategories()

  const items = useMemo(
    () => buildItems(tx.transactions, cat.categories, cat.cashflows, acc.accounts),
    [tx.transactions, cat.categories, cat.cashflows, acc.accounts]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.tx.description.toLowerCase().includes(q) || it.categoryName.toLowerCase().includes(q)
    )
  }, [items, search])

  const totalIn = items
    .filter((i) => i.kind === "income" || i.kind === "withdrawal")
    .reduce((s, i) => s + i.tx.amount, 0)
  const totalOut = items.filter((i) => i.kind === "outflow").reduce((s, i) => s + i.tx.amount, 0)

  const loading = tx.loading || acc.loading || cat.loading
  const error = tx.error ?? acc.error ?? cat.error

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(item: TxItem) {
    setEditing(item)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Log Transaksi</h1>
        <Button onClick={openNew} className="hidden gap-2 md:inline-flex">
          <Plus className="size-4" />
          Tambah
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium capitalize">
            {formatMonthLabel(month)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Input
          className="w-full sm:max-w-xs"
          placeholder="Cari keterangan atau kategori…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Summary label="Masuk" value={formatRupiah(totalIn)} className="text-green-600" />
        <Summary label="Keluar" value={formatRupiah(totalOut)} className="text-red-600" />
        <Summary label="Selisih" value={formatRupiah(totalIn - totalOut)} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Gagal memuat: {error}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          {search ? "Tidak ada transaksi yang cocok." : "Belum ada transaksi bulan ini."}
        </p>
      ) : (
        <>
          <TransactionTable items={filtered} onEdit={openEdit} />
          <TransactionCards items={filtered} onEdit={openEdit} />
        </>
      )}

      <Button
        size="icon"
        onClick={openNew}
        aria-label="Tambah transaksi"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-20 size-14 rounded-full shadow-lg md:hidden"
      >
        <Plus className="size-6" />
      </Button>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        cashflows={cat.cashflows}
        categories={cat.categories}
        accounts={acc.accounts}
        onSaved={tx.refresh}
      />
    </div>
  )
}

function Summary({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold sm:text-base ${className ?? ""}`}>{value}</p>
    </div>
  )
}