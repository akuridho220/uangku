import { Link } from "react-router-dom"
import { formatDateShort } from "@/lib/date"
import { accountText, type TxItem } from "@/lib/transactions"
import { AmountText } from "@/components/transactions/TxBits"

export function RecentTransactions({ items }: { items: TxItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Belum ada transaksi bulan ini.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it.tx.id} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{it.tx.description || it.categoryName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDateShort(it.tx.tx_date)} · {it.categoryName} · {accountText(it)}
              </p>
            </div>
            <div className="shrink-0 text-sm">
              <AmountText item={it} />
            </div>
          </li>
        ))}
      </ul>
      <Link to="/transaksi" className="text-sm font-medium text-primary hover:underline">
        Lihat semua transaksi →
      </Link>
    </div>
  )
}