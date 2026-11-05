import { formatDateLong } from "@/lib/date"
import { accountText, type TxItem } from "@/lib/transactions"
import { AmountText, CashflowPill } from "./TxBits"

type Props = { items: TxItem[]; onEdit: (item: TxItem) => void }

export function TransactionCards({ items, onEdit }: Props) {
  const groups: { date: string; items: TxItem[] }[] = []
  for (const it of items) {
    const last = groups[groups.length - 1]
    if (last && last.date === it.tx.tx_date) last.items.push(it)
    else groups.push({ date: it.tx.tx_date, items: [it] })
  }

  return (
    <div className="space-y-5 md:hidden">
      {groups.map((g) => (
        <section key={g.date}>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            {formatDateLong(g.date)}
          </h3>
          <div className="divide-y rounded-lg border">
            {g.items.map((it) => (
              <button
                key={it.tx.id}
                type="button"
                onClick={() => onEdit(it)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {it.tx.description || it.categoryName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CashflowPill item={it} />
                    <span className="text-xs text-muted-foreground">
                      {it.kind === "transfer"
                        ? accountText(it)
                        : `${it.categoryName} · ${accountText(it)}`}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-sm">
                  <AmountText item={it} />
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}