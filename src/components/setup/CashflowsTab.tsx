import { useState } from "react"
import { Pencil } from "lucide-react"
import { useCashflows } from "@/hooks/useCashflows"
import type { CashflowRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { CashflowDialog } from "./CashflowDialog"

export function CashflowsTab() {
  const { cashflows, loading, error, refresh } = useCashflows()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CashflowRow | null>(null)

  function openEdit(cashflow: CashflowRow) {
    setEditing(cashflow)
    setDialogOpen(true)
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat…</p>
  if (error) return <p className="text-sm text-destructive">Gagal memuat: {error}</p>

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border">
        {cashflows.map((cf) => (
          <div key={cf.id} className="flex items-start justify-between gap-3 p-4">
            <div className="flex min-w-0 gap-3">
              <span
                className="mt-1.5 size-3 shrink-0 rounded-full"
                style={{ backgroundColor: cf.color ?? "#9ca3af" }}
              />
              <div className="min-w-0">
                <p className="font-medium">{cf.label}</p>
                <p className="text-sm text-muted-foreground">
                  {cf.description || "Belum ada deskripsi."}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => openEdit(cf)}
              aria-label={`Ubah ${cf.label}`}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <CashflowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cashflow={editing}
        onSaved={refresh}
      />
    </div>
  )
}