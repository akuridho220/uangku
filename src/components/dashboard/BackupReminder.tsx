import { Link } from "react-router-dom"
import { getLastBackup } from "@/lib/backup"

const STALE_DAYS = 30

export function BackupReminder() {
  const last = getLastBackup()
  const days = last ? (Date.now() - new Date(last).getTime()) / 86_400_000 : Number.POSITIVE_INFINITY
  if (days <= STALE_DAYS) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p>
        {last
          ? "Sudah lebih dari 30 hari sejak cadangan terakhir dari perangkat ini."
          : "Kamu belum pernah mencadangkan data dari perangkat ini."}
      </p>
      <Link to="/setup?tab=data" className="font-medium text-primary hover:underline">
        Buat cadangan →
      </Link>
    </div>
  )
}