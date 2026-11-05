import { useMemo, useState, type ChangeEvent } from "react"
import { useAccounts } from "@/hooks/useAccounts"
import { useCategories } from "@/hooks/useCategories"
import { findMissing, parseCsv, parseRows, type ParseResult } from "@/lib/import-parse"
import { runImport, type ImportResult } from "@/lib/import-run"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ImportTab() {
  const acc = useAccounts()
  const cat = useCategories()

  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [createMissing, setCreateMissing] = useState(true)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const missing = useMemo(
    () => (parsed ? findMissing(parsed.rows, acc.accounts, cat.categories) : null),
    [parsed, acc.accounts, cat.categories]
  )

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setResult(null)
    setError(null)
    setFileName(file.name)

    const csv = parseCsv(await file.text())
    if (!csv) {
      setParsed(null)
      setError(
        "Baris header tidak ditemukan. Pastikan file CSV memiliki kolom Date dan Amount."
      )
      return
    }
    setParsed(parseRows(csv.records, csv.fields, cat.cashflows))
  }

  async function handleImport() {
    if (!parsed) return
    setImporting(true)
    setError(null)
    try {
      const r = await runImport({
        rows: parsed.rows,
        accounts: acc.accounts,
        categories: cat.categories,
        createMissing,
      })
      setResult(r)
      setParsed(null)
      setFileName(null)
      await Promise.all([acc.refresh(), cat.refresh()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import gagal.")
    }
    setImporting(false)
  }

  const ready = !acc.loading && !cat.loading

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <p className="font-medium">Import dari spreadsheet (CSV)</p>
        <p className="text-muted-foreground">
          Ekspor sheet Log Transactions sebagai CSV. Kolom yang dibaca: Date, Cashflow, Category,
          Transactions, Amount, Transfer In, Transfer Out. Import aman diulang: transaksi yang
          sudah ada akan dilewati.
        </p>
      </div>

      <Input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={!ready || importing} />
      {fileName && <p className="text-xs text-muted-foreground">File: {fileName}</p>}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {parsed?.headerError && <p className="text-sm text-destructive">{parsed.headerError}</p>}

      {parsed && !parsed.headerError && missing && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Baris siap diimpor</p>
              <p className="mt-1 text-lg font-semibold">{parsed.rows.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Baris bermasalah (dilewati)</p>
              <p className="mt-1 text-lg font-semibold">{parsed.issues.length}</p>
            </div>
          </div>

          {(missing.accounts.length > 0 || missing.categories.length > 0) && (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              {missing.accounts.length > 0 && (
                <div>
                  <p className="font-medium">Account yang belum ada ({missing.accounts.length})</p>
                  <p className="text-muted-foreground">{missing.accounts.join(", ")}</p>
                </div>
              )}
              {missing.categories.length > 0 && (
                <div>
                  <p className="font-medium">Kategori yang belum ada ({missing.categories.length})</p>
                  <p className="text-muted-foreground">
                    {missing.categories.map((c) => c.name).join(", ")}
                  </p>
                </div>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={createMissing}
                  onChange={(e) => setCreateMissing(e.target.checked)}
                />
                Buat otomatis (account dengan saldo awal Rp 0)
              </label>
              {!createMissing && (
                <p className="text-xs text-destructive">
                  Baris yang memakai account atau kategori di atas akan dilewati.
                </p>
              )}
            </div>
          )}

          {parsed.issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Baris bermasalah</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-3 text-xs text-muted-foreground">
                {parsed.issues.slice(0, 50).map((it) => (
                  <li key={it.line}>
                    Baris #{it.line}: {it.message}
                  </li>
                ))}
                {parsed.issues.length > 50 && <li>…dan {parsed.issues.length - 50} lainnya</li>}
              </ul>
            </div>
          )}

          <Button onClick={handleImport} disabled={importing || parsed.rows.length === 0}>
            {importing ? "Mengimpor…" : `Import ${parsed.rows.length} transaksi`}
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-1 rounded-lg border p-4 text-sm">
          <p className="font-medium">Import selesai</p>
          <p>{result.inserted} transaksi tersimpan.</p>
          {result.skippedDuplicate > 0 && (
            <p className="text-muted-foreground">
              {result.skippedDuplicate} dilewati karena sudah ada.
            </p>
          )}
          {result.skippedUnresolved > 0 && (
            <p className="text-muted-foreground">
              {result.skippedUnresolved} dilewati karena account/kategorinya belum ada.
            </p>
          )}
          {result.createdAccounts > 0 && (
            <p className="text-muted-foreground">
              {result.createdAccounts} account baru dibuat dengan saldo awal Rp 0. Atur saldo
              awalnya di tab Account.
            </p>
          )}
          {result.createdCategories > 0 && (
            <p className="text-muted-foreground">{result.createdCategories} kategori baru dibuat.</p>
          )}
        </div>
      )}
    </div>
  )
}