import { Pencil } from "lucide-react"
import { formatDateShort } from "@/lib/date"
import type { TxItem } from "@/lib/transactions"
import { Button } from "@/components/ui/button"
import { AmountText, CashflowPill } from "./TxBits"

type Props = { items: TxItem[]; onEdit: (item: TxItem) => void }

export function TransactionTable({ items, onEdit }: Props) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border md:block">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Tanggal</th>
            <th className="px-4 py-3 font-medium">Cashflow</th>
            <th className="px-4 py-3 font-medium">Kategori</th>
            <th className="px-4 py-3 font-medium">Keterangan</th>
            <th className="px-4 py-3 text-right font-medium">Nominal</th>
            <th className="px-4 py-3 font-medium">Transfer In</th>
            <th className="px-4 py-3 font-medium">Transfer Out</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((it) => (
            <tr key={it.tx.id} className="hover:bg-muted/40">
              <td className="whitespace-nowrap px-4 py-3">{formatDateShort(it.tx.tx_date)}</td>
              <td className="px-4 py-3">
                <CashflowPill item={it} />
              </td>
              <td className="px-4 py-3">{it.categoryName}</td>
              <td className="px-4 py-3">{it.tx.description || "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <AmountText item={it} />
              </td>
              <td className="px-4 py-3">{it.inName ?? ""}</td>
              <td className="px-4 py-3">{it.outName ?? ""}</td>
              <td className="px-2 py-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(it)} aria-label="Ubah">
                  <Pencil className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}