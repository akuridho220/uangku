import Papa from "papaparse"
import type { AccountRow, CashflowRow, CategoryRow } from "@/types/db"

/** Huruf kecil tanpa spasi/simbol: "Transfer In" -> "transferin" */
export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
/** Kunci pencocokan nama: tidak peka huruf besar/kecil dan spasi ganda */
export const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ")

const ALIASES = {
  date: ["date", "tanggal"],
  cashflow: ["cashflow"],
  category: ["category", "kategori"],
  description: ["transactions", "transaction", "keterangan", "description", "deskripsi"],
  amount: ["amount", "nominal", "jumlah"],
  in: ["transferin"],
  out: ["transferout"],
} as const

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, januari: 1,
  february: 2, feb: 2, februari: 2,
  march: 3, mar: 3, maret: 3,
  april: 4, apr: 4,
  may: 5, mei: 5,
  june: 6, jun: 6, juni: 6,
  july: 7, jul: 7, juli: 7,
  august: 8, aug: 8, agustus: 8, agu: 8, agt: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, oktober: 10, okt: 10,
  november: 11, nov: 11,
  december: 12, dec: 12, desember: 12, des: 12,
}

export function parseDate(raw: string): string | null {
  // buang nama hari di depan: "Wednesday, 1 July 2026" -> "1 July 2026"
  const s = raw.trim().replace(/^[A-Za-zÀ-ÿ]+,\s*/, "")
  let y = 0
  let m = 0
  let d = 0
  let match: RegExpMatchArray | null

  if ((match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) {
    y = +match[1]
    m = +match[2]
    d = +match[3]
  } else if ((match = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/))) {
    d = +match[1] // diasumsikan format hari/bulan/tahun
    m = +match[2]
    y = +match[3]
  } else if ((match = s.match(/^(\d{1,2})[\s-]+([A-Za-z]+)\.?,?[\s-]+(\d{4})$/))) {
    const month = MONTHS[match[2].toLowerCase()]
    if (!month) return null
    d = +match[1]
    m = month
    y = +match[3]
  } else {
    return null
  }

  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function parseAmount(raw: string): number | null {
  let s = raw.replace(/rp/gi, "").replace(/\s/g, "")
  if (!s) return null
  s = s.replace(/[.,]\d{1,2}$/, "") // buang pecahan desimal (1-2 digit di belakang)
  const digits = s.replace(/\D/g, "")
  if (!digits) return null
  const n = Number(digits)
  return n > 0 ? n : null
}

/** Mencari baris header (boleh ada baris judul di atasnya) dan mengubah sisanya jadi record. */
export function parseCsv(
  text: string
): { fields: string[]; records: Record<string, string>[] } | null {
  for (const delimiter of [",", ";", "\t"]) {
    const res = Papa.parse<string[]>(text, { delimiter, skipEmptyLines: "greedy" })
    const headerIdx = res.data.findIndex((row) => {
      const cells = row.map(norm)
      return (
        cells.some((c) => (ALIASES.date as readonly string[]).includes(c)) &&
        cells.some((c) => (ALIASES.amount as readonly string[]).includes(c))
      )
    })
    if (headerIdx === -1) continue

    const fields = res.data[headerIdx].map((f) => f.trim())
    const records = res.data
      .slice(headerIdx + 1)
      .map((row) => Object.fromEntries(fields.map((f, i) => [f, row[i] ?? ""])))
    return { fields, records }
  }
  return null
}

export type ParsedRow = {
  line: number
  date: string
  description: string
  amount: number
  cashflowId: string | null // null = transfer
  categoryName: string | null
  inName: string | null
  outName: string | null
}

export type RowIssue = { line: number; message: string }

export type ParseResult = {
  rows: ParsedRow[]
  issues: RowIssue[]
  headerError: string | null
}

function findColumn(fields: string[], names: readonly string[]) {
  return fields.find((f) => names.includes(norm(f)))
}

export function parseRows(
  records: Record<string, string>[],
  fields: string[],
  cashflows: CashflowRow[]
): ParseResult {
  const col = {
    date: findColumn(fields, ALIASES.date),
    cashflow: findColumn(fields, ALIASES.cashflow),
    category: findColumn(fields, ALIASES.category),
    description: findColumn(fields, ALIASES.description),
    amount: findColumn(fields, ALIASES.amount),
    in: findColumn(fields, ALIASES.in),
    out: findColumn(fields, ALIASES.out),
  }

  const missing: string[] = []
  if (!col.date) missing.push("Date")
  if (!col.cashflow) missing.push("Cashflow")
  if (!col.amount) missing.push("Amount")
  if (!col.in && !col.out) missing.push("Transfer In / Transfer Out")
  if (missing.length > 0) {
    return {
      rows: [],
      issues: [],
      headerError: `Kolom tidak ditemukan: ${missing.join(", ")}. Kolom yang terbaca: ${fields
        .filter(Boolean)
        .join(", ")}`,
    }
  }

  const cashflowByKey = new Map<string, CashflowRow>()
  for (const cf of cashflows) {
    cashflowByKey.set(norm(cf.label), cf)
    cashflowByKey.set(norm(cf.code), cf)
  }

  const rows: ParsedRow[] = []
  const issues: RowIssue[] = []

  records.forEach((rec, i) => {
    const line = i + 1
    const get = (c?: string) => (c ? (rec[c] ?? "").trim() : "")

    const dateRaw = get(col.date)
    const cashflowRaw = get(col.cashflow)
    const categoryRaw = get(col.category)
    const description = get(col.description)
    const amountRaw = get(col.amount)
    const inName = get(col.in) || null
    const outName = get(col.out) || null

    if (!dateRaw && !amountRaw && !cashflowRaw) return // baris kosong

    const date = parseDate(dateRaw)
    if (!date) {
      issues.push({ line, message: `Tanggal tidak terbaca: "${dateRaw}"` })
      return
    }
    const amount = parseAmount(amountRaw)
    if (!amount) {
      issues.push({ line, message: `Nominal tidak valid: "${amountRaw}" (${dateRaw})` })
      return
    }

    const cfKey = norm(cashflowRaw)
    const isTransfer = cfKey === "transfer" || (!cfKey && !!inName && !!outName)

    if (isTransfer) {
      if (!inName || !outName) {
        issues.push({ line, message: `Transfer harus punya Transfer In dan Transfer Out (${dateRaw})` })
        return
      }
      if (key(inName) === key(outName)) {
        issues.push({ line, message: `Account asal dan tujuan sama (${dateRaw})` })
        return
      }
      rows.push({ line, date, description, amount, cashflowId: null, categoryName: null, inName, outName })
      return
    }

    const cf = cashflowByKey.get(cfKey)
    if (!cf) {
      issues.push({ line, message: `Cashflow tidak dikenal: "${cashflowRaw}" (${dateRaw})` })
      return
    }
    if (!categoryRaw) {
      issues.push({ line, message: `Kategori kosong (${dateRaw}, ${cashflowRaw})` })
      return
    }

    const isIncome = cf.code === "income"
    const isSavingLike = cf.code === "saving_invest" || cf.code === "financial_goals"
    // Income selalu masuk; Saving/Goals yang hanya punya Transfer In = pencairan
    const inbound = isIncome || (isSavingLike && !outName && !!inName)
    const accountName = inbound ? (inName ?? outName) : (outName ?? inName)
    if (!accountName) {
      issues.push({ line, message: `Account (Transfer In/Out) kosong (${dateRaw}, ${categoryRaw})` })
      return
    }

    rows.push({
      line,
      date,
      description,
      amount,
      cashflowId: cf.id,
      categoryName: categoryRaw,
      inName: inbound ? accountName : null,
      outName: inbound ? null : accountName,
    })
  })

  return { rows, issues, headerError: null }
}

/** Account dan kategori di file yang belum ada di aplikasi. */
export function findMissing(rows: ParsedRow[], accounts: AccountRow[], categories: CategoryRow[]) {
  const accountKeys = new Set(accounts.map((a) => key(a.name)))
  const categoryKeys = new Set(categories.map((c) => `${c.cashflow_id}|${key(c.name)}`))

  const missingAccounts = new Map<string, string>()
  const missingCategories = new Map<string, { cashflowId: string; name: string }>()

  for (const r of rows) {
    for (const name of [r.inName, r.outName]) {
      if (name && !accountKeys.has(key(name)) && !missingAccounts.has(key(name))) {
        missingAccounts.set(key(name), name)
      }
    }
    if (r.cashflowId && r.categoryName) {
      const k = `${r.cashflowId}|${key(r.categoryName)}`
      if (!categoryKeys.has(k) && !missingCategories.has(k)) {
        missingCategories.set(k, { cashflowId: r.cashflowId, name: r.categoryName })
      }
    }
  }

  return {
    accounts: [...missingAccounts.values()],
    categories: [...missingCategories.values()],
  }
}