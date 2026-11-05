import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format"
import type { TxItem } from "@/lib/transactions"

export function CashflowPill({ item }: { item: TxItem }) {
  const color = item.cashflow?.color ?? "#6b7280"
  const label = item.cashflow?.label ?? "Transfer"
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {label}
    </span>
  )
}

export function AmountText({ item }: { item: TxItem }) {
  const cls =
    item.kind === "income"
      ? "text-green-600"
      : item.kind === "outflow"
        ? "text-red-600"
        : "text-muted-foreground"
  const sign = item.kind === "income" ? "+" : item.kind === "outflow" ? "−" : ""

  return (
    <span className={cn("font-medium tabular-nums", cls)}>
      {sign}
      {formatRupiah(item.tx.amount)}
    </span>
  )
}