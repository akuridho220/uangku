import { supabase } from "@/lib/supabase"
import { findMissing, key, type ParsedRow } from "@/lib/import-parse"
import type { AccountRow, CategoryRow, TransactionRow } from "@/types/db"

export type ImportResult = {
  inserted: number
  skippedDuplicate: number
  skippedUnresolved: number
  createdAccounts: number
  createdCategories: number
}

type NewTx = {
  tx_date: string
  description: string
  amount: number
  category_id: string | null
  account_in_id: string | null
  account_out_id: string | null
}

const dupKey = (t: NewTx | TransactionRow) =>
  [
    t.tx_date,
    t.amount,
    t.description.trim(),
    t.category_id ?? "",
    t.account_in_id ?? "",
    t.account_out_id ?? "",
  ].join("|")

async function fetchExisting(from: string, to: string) {
  const all: TransactionRow[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("tx_date", from)
      .lte("tx_date", to)
      .order("created_at")
      .order("id")
      .range(offset, offset + 999)
    if (error) throw new Error(error.message)
    all.push(...(data as TransactionRow[]))
    if (!data || data.length < 1000) break
  }
  return all
}

type Params = {
  rows: ParsedRow[]
  accounts: AccountRow[]
  categories: CategoryRow[]
  createMissing: boolean
}

export async function runImport({
  rows,
  accounts,
  categories,
  createMissing,
}: Params): Promise<ImportResult> {
  const accountIds = new Map(accounts.map((a) => [key(a.name), a.id]))
  const categoryIds = new Map(categories.map((c) => [`${c.cashflow_id}|${key(c.name)}`, c.id]))
  let createdAccounts = 0
  let createdCategories = 0

  // 1. Buat account dan kategori yang belum ada
  if (createMissing) {
    const missing = findMissing(rows, accounts, categories)

    if (missing.accounts.length > 0) {
      let order = Math.max(0, ...accounts.map((a) => a.sort_order))
      const { data, error } = await supabase
        .from("accounts")
        .insert(missing.accounts.map((name) => ({ name, opening_balance: 0, sort_order: ++order })))
        .select("id, name")
      if (error) throw new Error(`Gagal membuat account: ${error.message}`)
      for (const a of data ?? []) accountIds.set(key(a.name), a.id)
      createdAccounts = data?.length ?? 0
    }

    if (missing.categories.length > 0) {
      const orders = new Map<string, number>()
      for (const c of categories) {
        orders.set(c.cashflow_id, Math.max(orders.get(c.cashflow_id) ?? 0, c.sort_order))
      }
      const { data, error } = await supabase
        .from("categories")
        .insert(
          missing.categories.map((c) => {
            const next = (orders.get(c.cashflowId) ?? 0) + 1
            orders.set(c.cashflowId, next)
            return { cashflow_id: c.cashflowId, name: c.name, sort_order: next }
          })
        )
        .select("id, cashflow_id, name")
      if (error) throw new Error(`Gagal membuat kategori: ${error.message}`)
      for (const c of data ?? []) categoryIds.set(`${c.cashflow_id}|${key(c.name)}`, c.id)
      createdCategories = data?.length ?? 0
    }
  }

  // 2. Ubah nama menjadi id
  const payload: NewTx[] = []
  let skippedUnresolved = 0

  for (const r of rows) {
    const category_id =
      r.cashflowId && r.categoryName
        ? (categoryIds.get(`${r.cashflowId}|${key(r.categoryName)}`) ?? null)
        : null
    const account_in_id = r.inName ? (accountIds.get(key(r.inName)) ?? null) : null
    const account_out_id = r.outName ? (accountIds.get(key(r.outName)) ?? null) : null

    const unresolved =
      (r.cashflowId !== null && !category_id) ||
      (r.inName && !account_in_id) ||
      (r.outName && !account_out_id)
    if (unresolved) {
      skippedUnresolved++
      continue
    }

    payload.push({
      tx_date: r.date,
      description: r.description,
      amount: r.amount,
      category_id,
      account_in_id,
      account_out_id,
    })
  }

  // 3. Lewati yang sudah ada (cocokkan dengan hitungan, jadi transaksi kembar yang sah tetap masuk)
  let skippedDuplicate = 0
  let toInsert = payload

  if (payload.length > 0) {
    const dates = payload.map((p) => p.tx_date).sort()
    const existing = await fetchExisting(dates[0], dates[dates.length - 1])

    const counts = new Map<string, number>()
    for (const t of existing) {
      const k = dupKey(t)
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }

    toInsert = payload.filter((p) => {
      const k = dupKey(p)
      const n = counts.get(k) ?? 0
      if (n > 0) {
        counts.set(k, n - 1)
        skippedDuplicate++
        return false
      }
      return true
    })
  }

  // 4. Simpan per 200 baris
  let inserted = 0
  for (let i = 0; i < toInsert.length; i += 200) {
    const chunk = toInsert.slice(i, i + 200)
    const { error } = await supabase.from("transactions").insert(chunk)
    if (error) {
      throw new Error(`Berhenti setelah ${inserted} transaksi tersimpan: ${error.message}`)
    }
    inserted += chunk.length
  }

  return { inserted, skippedDuplicate, skippedUnresolved, createdAccounts, createdCategories }
}