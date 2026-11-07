import { supabase } from "@/lib/supabase"
import { todayISO } from "@/lib/date"

export type Row = Record<string, unknown>

// Urutan induk → anak. Dipakai untuk memulihkan; dibalik untuk menghapus.
export const TABLES = [
  "cashflows",
  "accounts",
  "categories",
  "transactions",
  "budgets",
  "valuations",
  "stocks",
  "stock_trades",
  "stock_dividends",
  "stock_settings",
] as const

export type TableName = (typeof TABLES)[number]

export const TABLE_LABELS: Record<TableName, string> = {
  cashflows: "Cashflow",
  accounts: "Account",
  categories: "Kategori",
  transactions: "Transaksi",
  budgets: "Budget",
  valuations: "Update nilai tabungan",
  stocks: "Daftar saham",
  stock_trades: "Transaksi saham",
  stock_dividends: "Dividen",
  stock_settings: "Pengaturan saham",
}

export type BackupFile = {
  app: "keuangan-pribadi"
  version: 1
  exportedAt: string
  tables: Record<TableName, Row[]>
}

const LAST_KEY = "keuangan:lastBackupAt"

export function getLastBackup(): string | null {
  try {
    return localStorage.getItem(LAST_KEY)
  } catch {
    return null
  }
}

export function stripUser(row: Row): Row {
  const copy = { ...row }
  delete copy.user_id
  return copy
}

async function fetchAll(table: TableName): Promise<Row[]> {
  const rows: Row[] = []
  for (let offset = 0; ; offset += 1000) {
    const res =
      table === "stock_settings"
        ? await supabase.from(table).select("*").range(offset, offset + 999)
        : await supabase.from(table).select("*").order("id").range(offset, offset + 999)

    if (res.error) throw new Error(`${TABLE_LABELS[table]}: ${res.error.message}`)
    rows.push(...(res.data as Row[]))
    if (!res.data || res.data.length < 1000) break
  }
  return rows
}

export async function buildBackup(): Promise<BackupFile> {
  const tables = {} as Record<TableName, Row[]>
  for (const t of TABLES) {
    tables[t] = (await fetchAll(t)).map(stripUser) // user_id tidak ikut disimpan
  }
  return { app: "keuangan-pribadi", version: 1, exportedAt: new Date().toISOString(), tables }
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadBackup(): Promise<BackupFile> {
  const backup = await buildBackup()
  downloadFile(`keuangan-backup-${todayISO()}.json`, JSON.stringify(backup), "application/json")
  try {
    localStorage.setItem(LAST_KEY, backup.exportedAt)
  } catch {
    // penyimpanan lokal tidak tersedia; abaikan
  }
  return backup
}

export function countRows(backup: BackupFile) {
  return TABLES.map((t) => ({ table: t, label: TABLE_LABELS[t], count: backup.tables[t].length }))
}

const cell = (v: unknown) => {
  const s = String(v ?? "")
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV transaksi dengan kolom seperti spreadsheet lama (pemisah titik koma, cocok untuk Excel berbahasa Indonesia). */
export async function downloadTransactionsCsv(): Promise<number> {
  const [txs, cats, cfs, accs] = await Promise.all([
    fetchAll("transactions"),
    fetchAll("categories"),
    fetchAll("cashflows"),
    fetchAll("accounts"),
  ])

  const cfById = new Map(cfs.map((c) => [c.id as string, c]))
  const catById = new Map(cats.map((c) => [c.id as string, c]))
  const accName = new Map(accs.map((a) => [a.id as string, a.name as string]))

  const sorted = [...txs].sort((a, b) => String(a.tx_date).localeCompare(String(b.tx_date)))

  const lines: unknown[][] = [
    ["Date", "Cashflow", "Category", "Transactions", "Amount", "Transfer In", "Transfer Out"],
    ...sorted.map((t) => {
      const cat = t.category_id ? catById.get(t.category_id as string) : undefined
      const cf = cat ? cfById.get(cat.cashflow_id as string) : undefined
      return [
        t.tx_date,
        cat ? (cf?.label ?? "") : "Transfer",
        cat ? cat.name : "",
        t.description ?? "",
        t.amount,
        t.account_in_id ? (accName.get(t.account_in_id as string) ?? "") : "",
        t.account_out_id ? (accName.get(t.account_out_id as string) ?? "") : "",
      ]
    }),
  ]

  const csv = "\uFEFF" + lines.map((r) => r.map(cell).join(";")).join("\r\n")
  downloadFile(`keuangan-transaksi-${todayISO()}.csv`, csv, "text/csv;charset=utf-8")
  return sorted.length
}