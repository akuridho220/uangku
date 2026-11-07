import { supabase } from "@/lib/supabase"
import {
  TABLES,
  TABLE_LABELS,
  stripUser,
  type BackupFile,
  type Row,
  type TableName,
} from "@/lib/backup"

export type ParsedBackup = {
  backup: BackupFile | null
  problems: string[]
  error: string | null
}

const ids = (rows: Row[]) => new Set(rows.map((r) => r.id as string))

function checkIntegrity(b: BackupFile): string[] {
  const problems: string[] = []

  for (const t of TABLES) {
    if (t === "stock_settings") continue
    if (b.tables[t].some((r) => typeof r.id !== "string")) {
      problems.push(`${TABLE_LABELS[t]}: ada baris tanpa id.`)
    }
  }
  if (b.tables.stock_settings.length > 1) {
    problems.push("Pengaturan saham: lebih dari satu baris.")
  }

  const cashflowIds = ids(b.tables.cashflows)
  const accountIds = ids(b.tables.accounts)
  const categoryIds = ids(b.tables.categories)
  const stockIds = ids(b.tables.stocks)

  const need = (table: TableName, col: string, valid: Set<string>, nullable = false) => {
    let bad = 0
    for (const r of b.tables[table]) {
      const v = r[col]
      if (v === null || v === undefined) {
        if (!nullable) bad++
      } else if (!valid.has(v as string)) {
        bad++
      }
    }
    if (bad > 0) {
      problems.push(`${TABLE_LABELS[table]}: ${bad} baris merujuk ke data yang tidak ada di cadangan (${col}).`)
    }
  }

  need("categories", "cashflow_id", cashflowIds)
  need("transactions", "category_id", categoryIds, true)
  need("transactions", "account_in_id", accountIds, true)
  need("transactions", "account_out_id", accountIds, true)
  need("budgets", "category_id", categoryIds)
  need("valuations", "category_id", categoryIds)
  need("stock_trades", "stock_id", stockIds)
  need("stock_dividends", "stock_id", stockIds)
  need("stock_settings", "rdn_account_id", accountIds, true)

  return problems
}

export function parseBackup(text: string): ParsedBackup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { backup: null, problems: [], error: "File bukan JSON yang valid." }
  }

  const f = json as Partial<BackupFile> | null
  if (!f || f.app !== "keuangan-pribadi" || f.version !== 1 || !f.tables || typeof f.tables !== "object") {
    return {
      backup: null,
      problems: [],
      error: "Ini bukan file cadangan aplikasi ini, atau versinya tidak dikenali.",
    }
  }

  const tables = {} as Record<TableName, Row[]>
  for (const t of TABLES) {
    const rows = (f.tables as Record<string, unknown>)[t]
    if (rows === undefined) {
      tables[t] = [] // tabel yang belum ada saat cadangan dibuat
    } else if (Array.isArray(rows)) {
      tables[t] = (rows as Row[]).map(stripUser)
    } else {
      return { backup: null, problems: [], error: `Data tabel ${TABLE_LABELS[t]} rusak.` }
    }
  }

  const backup: BackupFile = {
    app: "keuangan-pribadi",
    version: 1,
    exportedAt: String(f.exportedAt ?? ""),
    tables,
  }
  return { backup, problems: checkIntegrity(backup), error: null }
}

/** Mengganti SELURUH data milik akun ini dengan isi cadangan. */
export async function restoreBackup(backup: BackupFile, onProgress: (message: string) => void) {
  for (const t of [...TABLES].reverse()) {
    onProgress(`Menghapus data lama: ${TABLE_LABELS[t]}…`)
    const col = t === "stock_settings" ? "user_id" : "id"
    const { error } = await supabase.from(t).delete().not(col, "is", null)
    if (error) throw new Error(`Gagal menghapus ${TABLE_LABELS[t]}: ${error.message}`)
  }

  for (const t of TABLES) {
    const rows = backup.tables[t]
    if (rows.length === 0) continue

    onProgress(`Memulihkan ${TABLE_LABELS[t]} (${rows.length} baris)…`)
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from(t).insert(rows.slice(i, i + 500))
      if (error) throw new Error(`Gagal memulihkan ${TABLE_LABELS[t]}: ${error.message}`)
    }
  }
}