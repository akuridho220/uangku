import { useState } from "react"
import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAccounts } from "@/hooks/useAccounts"
import { formatRupiah } from "@/lib/format"
import type { AccountRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { AccountDialog } from "./AccountDialog"

export function AccountsTab() {
  const { accounts, loading, error, refresh } = useAccounts()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AccountRow | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const active = accounts.filter((a) => !a.is_archived)
  const archived = accounts.filter((a) => a.is_archived)
  const total = active.reduce((sum, a) => sum + a.balance, 0)
  const nextSortOrder = Math.max(0, ...accounts.map((a) => a.sort_order)) + 1

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(account: AccountRow) {
    setEditing(account)
    setDialogOpen(true)
  }

  async function setArchived(account: AccountRow, value: boolean) {
    setActionError(null)
    const { error } = await supabase
      .from("accounts")
      .update({ is_archived: value })
      .eq("id", account.id)
    if (error) setActionError(error.message)
    refresh()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat…</p>
  if (error) return <p className="text-sm text-destructive">Gagal memuat: {error}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total saldo</p>
          <p className="text-2xl font-semibold">{formatRupiah(total)}</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="size-4" />
          Tambah
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="divide-y rounded-lg border">
        {active.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Belum ada account.</p>
        )}
        {active.map((a) => (
          <AccountItem
            key={a.id}
            account={a}
            onEdit={() => openEdit(a)}
            onToggleArchive={() => setArchived(a, true)}
          />
        ))}
      </div>

      {archived.length > 0 && (
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Sembunyikan" : "Tampilkan"} arsip ({archived.length})
          </Button>
          {showArchived && (
            <div className="divide-y rounded-lg border">
              {archived.map((a) => (
                <AccountItem
                  key={a.id}
                  account={a}
                  archived
                  onEdit={() => openEdit(a)}
                  onToggleArchive={() => setArchived(a, false)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editing}
        nextSortOrder={nextSortOrder}
        onSaved={refresh}
      />
    </div>
  )
}

type ItemProps = {
  account: AccountRow
  archived?: boolean
  onEdit: () => void
  onToggleArchive: () => void
}

function AccountItem({ account, archived, onEdit, onToggleArchive }: ItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className={archived ? "min-w-0 opacity-60" : "min-w-0"}>
        <p className="truncate font-medium">{account.name}</p>
        <p className="text-sm text-muted-foreground">{formatRupiah(account.balance)}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Ubah">
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleArchive}
          aria-label={archived ? "Aktifkan kembali" : "Arsipkan"}
        >
          {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
        </Button>
      </div>
    </div>
  )
}