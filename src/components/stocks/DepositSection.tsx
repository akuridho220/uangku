import { formatDateMedium } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { AccountRow, TransactionRow } from "@/types/db"

type Props = {
  transfers: TransactionRow[]
  rdnId: string | null
  openingCapital: number
  accounts: AccountRow[]
  total: number
}

export function DepositSection({ transfers, rdnId, openingCapital, accounts, total }: Props) {
  if (!rdnId) {
    return (
      <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Pilih account RDN di Pengaturan untuk melihat riwayat deposit.
      </p>
    )
  }

  const nameById = new Map(accounts.map((a) => [a.id, a.name]))

  const rows = transfers
    .map((t) => {
      const incoming = t.account_in_id === rdnId
      const otherId = incoming ? t.account_out_id : t.account_in_id
      const other = (otherId && nameById.get(otherId)) ?? "?"
      return {
        id: t.id,
        date: t.tx_date,
        amount: incoming ? t.amount : -t.amount,
        note: [incoming ? `dari ${other}` : `ke ${other}`, t.description].filter(Boolean).join(" · "),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-3 text-left font-medium">Tanggal</th>
            <th className="px-3 py-3 text-right font-medium">Nominal</th>
            <th className="px-3 py-3 text-left font-medium">Catatan</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-3 py-3">{formatDateMedium(r.date)}</td>
              <td className={cn("px-3 py-3 text-right tabular-nums", r.amount < 0 && "text-red-600")}>
                {formatRupiah(r.amount)}
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{r.note}</td>
            </tr>
          ))}
          {openingCapital > 0 && (
            <tr>
              <td className="px-3 py-3 text-muted-foreground">Modal awal</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatRupiah(openingCapital)}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                Setoran sebelum transfernya tercatat (diatur di Pengaturan)
              </td>
            </tr>
          )}
          {rows.length === 0 && openingCapital === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                Belum ada deposit. Catat Transfer ke account RDN di menu Transaksi.
              </td>
            </tr>
          )}
          <tr className="bg-muted/30">
            <td className="px-3 py-3 text-right text-xs text-muted-foreground">Total</td>
            <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatRupiah(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}