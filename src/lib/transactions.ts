import type { AccountRow, CashflowRow, CategoryRow, TransactionRow } from "@/types/db"

export type TxKind = "income" | "outflow" | "transfer"

export type TxItem = {
  tx: TransactionRow
  kind: TxKind
  cashflow: CashflowRow | null
  categoryName: string
  inName: string | null
  outName: string | null
}

export function buildItems(
  txs: TransactionRow[],
  categories: CategoryRow[],
  cashflows: CashflowRow[],
  accounts: AccountRow[]
): TxItem[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const cashflowMap = new Map(cashflows.map((c) => [c.id, c]))
  const accountMap = new Map(accounts.map((a) => [a.id, a]))

  return txs.map((tx) => {
    const inName = tx.account_in_id ? (accountMap.get(tx.account_in_id)?.name ?? "?") : null
    const outName = tx.account_out_id ? (accountMap.get(tx.account_out_id)?.name ?? "?") : null

    if (!tx.category_id) {
      return { tx, kind: "transfer", cashflow: null, categoryName: "Transfer", inName, outName }
    }

    const category = categoryMap.get(tx.category_id)
    const cashflow = category ? (cashflowMap.get(category.cashflow_id) ?? null) : null
    return {
      tx,
      kind: cashflow?.code === "income" ? "income" : "outflow",
      cashflow,
      categoryName: category?.name ?? "?",
      inName,
      outName,
    }
  })
}

export function accountText(item: TxItem) {
  if (item.kind === "transfer") return `${item.outName} → ${item.inName}`
  return item.kind === "income" ? (item.inName ?? "") : (item.outName ?? "")
}