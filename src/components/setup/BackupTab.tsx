import { useState, type ChangeEvent } from "react"
import {
  countRows,
  downloadBackup,
  downloadTransactionsCsv,
  getLastBackup,
  type BackupFile,
} from "@/lib/backup"
import { parseBackup, restoreBackup } from "@/lib/restore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" })
const CONFIRM_WORD = "PULIHKAN"
const STALE_DAYS = 30

type Parsed = { backup: BackupFile; problems: string[] }

export function BackupTab() {
  const [busy, setBusy] = useState<"backup" | "csv" | "restore" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastBackup, setLastBackup] = useState<string | null>(getLastBackup())

  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [confirmText, setConfirmText] = useState("")
  const [progress, setProgress] = useState<string | null>(null)
  const [restoreDone, setRestoreDone] = useState(false)

  const daysSince = lastBackup
    ? (Date.now() - new Date(lastBackup).getTime()) / 86_400_000
    : Number.POSITIVE_INFINITY
  const stale = daysSince > STALE_DAYS

  async function handleBackup() {
    setBusy("backup")
    setError(null)
    setMessage(null)
    try {
      const backup = await downloadBackup()
      const total = countRows(backup).reduce((s, r) => s + r.count, 0)
      setLastBackup(getLastBackup())
      setMessage(`Cadangan terunduh (${total} baris data). Simpan juga salinannya di tempat lain.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat cadangan.")
    }
    setBusy(null)
  }

  async function handleCsv() {
    setBusy("csv")
    setError(null)
    setMessage(null)
    try {
      const n = await downloadTransactionsCsv()
      setMessage(`${n} transaksi diekspor ke CSV.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengekspor transaksi.")
    }
    setBusy(null)
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setError(null)
    setMessage(null)
    setRestoreDone(false)
    setConfirmText("")
    setFileName(file.name)

    const result = parseBackup(await file.text())
    if (result.error || !result.backup) {
      setParsed(null)
      setError(result.error ?? "File tidak bisa dibaca.")
      return
    }
    setParsed({ backup: result.backup, problems: result.problems })
  }

  async function handleRestore() {
    if (!parsed || parsed.problems.length > 0 || confirmText !== CONFIRM_WORD) return

    setBusy("restore")
    setError(null)
    setMessage(null)
    try {
      setProgress("Mengunduh cadangan data saat ini sebagai pengaman…")
      await downloadBackup()
      setLastBackup(getLastBackup())

      await restoreBackup(parsed.backup, setProgress)

      setProgress(null)
      setRestoreDone(true)
      setParsed(null)
      setFileName(null)
      setConfirmText("")
    } catch (e) {
      setProgress(null)
      setError(
        `${e instanceof Error ? e.message : "Pemulihan gagal."} Data sebelum pemulihan sudah tersimpan di file cadangan yang baru terunduh. Kamu bisa mengulang pemulihan dengan file yang sama.`
      )
    }
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">Cadangan data</h2>
          <p className="text-sm text-muted-foreground">
            Paket gratis Supabase tidak punya cadangan otomatis. Unduh cadangan secara berkala dan
            simpan di tempat lain (Google Drive, email, atau flashdisk).
          </p>
        </div>

        <p className={stale ? "text-sm text-amber-600" : "text-sm text-muted-foreground"}>
          {lastBackup
            ? `Terakhir dicadangkan dari perangkat ini: ${dateTime.format(new Date(lastBackup))}${stale ? ". Sudah lebih dari 30 hari." : "."}`
            : "Belum pernah dicadangkan dari perangkat ini."}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleBackup} disabled={busy !== null}>
            {busy === "backup" ? "Menyiapkan…" : "Unduh cadangan lengkap (.json)"}
          </Button>
          <Button variant="outline" onClick={handleCsv} disabled={busy !== null}>
            {busy === "csv" ? "Menyiapkan…" : "Ekspor transaksi (.csv)"}
          </Button>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">Pulihkan dari cadangan</h2>
          <p className="text-sm text-muted-foreground">
            Mengganti <span className="font-medium">seluruh data</span> akun ini dengan isi file
            cadangan (.json). Cadangan data saat ini diunduh otomatis lebih dulu.
          </p>
        </div>

        <Input type="file" accept=".json,application/json" onChange={handleFile} disabled={busy !== null} />
        {fileName && <p className="text-xs text-muted-foreground">File: {fileName}</p>}

        {parsed && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-2 text-muted-foreground">
                Cadangan dibuat{" "}
                {parsed.backup.exportedAt
                  ? dateTime.format(new Date(parsed.backup.exportedAt))
                  : "(tanggal tidak diketahui)"}
                . Isinya:
              </p>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                {countRows(parsed.backup).map((r) => (
                  <li key={r.table} className="flex justify-between gap-3">
                    <span>{r.label}</span>
                    <span className="tabular-nums">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            {parsed.problems.length > 0 ? (
              <ul className="space-y-1 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
                <li className="font-medium">File ini tidak bisa dipulihkan:</li>
                {parsed.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <p>
                  Semua data yang ada sekarang akan <span className="font-semibold">dihapus dan
                  diganti</span> dengan isi cadangan ini. Ketik{" "}
                  <span className="font-mono font-semibold">{CONFIRM_WORD}</span> untuk melanjutkan.
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Ketik ${CONFIRM_WORD}`}
                  autoComplete="off"
                  disabled={busy !== null}
                />
                <Button
                  variant="destructive"
                  onClick={handleRestore}
                  disabled={busy !== null || confirmText !== CONFIRM_WORD}
                >
                  {busy === "restore" ? "Memulihkan…" : "Pulihkan sekarang"}
                </Button>
              </div>
            )}
          </div>
        )}

        {progress && <p className="text-sm text-muted-foreground">{progress}</p>}

        {restoreDone && (
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <p className="font-medium">Pemulihan selesai.</p>
            <p className="text-muted-foreground">
              Muat ulang aplikasi agar semua halaman memakai data hasil pemulihan.
            </p>
            <Button size="sm" onClick={() => window.location.reload()}>
              Muat ulang
            </Button>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}