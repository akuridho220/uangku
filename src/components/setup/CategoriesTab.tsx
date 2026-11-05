import { useState } from "react"
import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useCategories } from "@/hooks/useCategories"
import { formatRupiah } from "@/lib/format"
import type { CategoryRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { CategoryDialog } from "./CategoryDialog"

export function CategoriesTab() {
  const { cashflows, categories, loading, error, refresh } = useCategories()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const current = cashflows.find((c) => c.id === selectedId) ?? cashflows[0]
  const inCurrent = categories.filter((c) => c.cashflow_id === current?.id)
  const active = inCurrent.filter((c) => !c.is_archived)
  const archived = inCurrent.filter((c) => c.is_archived)
  const nextSortOrder = Math.max(0, ...inCurrent.map((c) => c.sort_order)) + 1
  const isGoal = current?.code === "financial_goals"

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(category: CategoryRow) {
    setEditing(category)
    setDialogOpen(true)
  }

  async function setArchived(category: CategoryRow, value: boolean) {
    setActionError(null)
    const { error } = await supabase
      .from("categories")
      .update({ is_archived: value })
      .eq("id", category.id)
    if (error) setActionError(error.message)
    refresh()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat…</p>
  if (error) return <p className="text-sm text-destructive">Gagal memuat: {error}</p>
  if (!current) return <p className="text-sm text-muted-foreground">Cashflow belum tersedia.</p>

  return (
    <div className="space-y-4">
      {/* Pilihan cashflow */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {cashflows.map((cf) => {
          const count = categories.filter(
            (c) => c.cashflow_id === cf.id && !c.is_archived
          ).length
          return (
            <Button
              key={cf.id}
              size="sm"
              variant={cf.id === current.id ? "default" : "outline"}
              className="shrink-0 gap-2"
              onClick={() => {
                setSelectedId(cf.id)
                setShowArchived(false)
              }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: cf.color ?? "#9ca3af" }}
              />
              {cf.label}
              <span className="opacity-70">{count}</span>
            </Button>
          )
        })}
      </div>

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">{current.description}</p>
        <Button onClick={openNew} className="shrink-0 gap-2">
          <Plus className="size-4" />
          Tambah
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="divide-y rounded-lg border">
        {active.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Belum ada kategori.</p>
        )}
        {active.map((c) => (
          <CategoryItem
            key={c.id}
            category={c}
            showTarget={isGoal}
            onEdit={() => openEdit(c)}
            onToggleArchive={() => setArchived(c, true)}
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
              {archived.map((c) => (
                <CategoryItem
                  key={c.id}
                  category={c}
                  archived
                  showTarget={isGoal}
                  onEdit={() => openEdit(c)}
                  onToggleArchive={() => setArchived(c, false)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cashflow={current}
        category={editing}
        nextSortOrder={nextSortOrder}
        onSaved={refresh}
      />
    </div>
  )
}

type ItemProps = {
  category: CategoryRow
  archived?: boolean
  showTarget: boolean
  onEdit: () => void
  onToggleArchive: () => void
}

function CategoryItem({ category, archived, showTarget, onEdit, onToggleArchive }: ItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className={archived ? "min-w-0 opacity-60" : "min-w-0"}>
        <p className="truncate font-medium">{category.name}</p>
        {showTarget && (
          <p className="text-sm text-muted-foreground">
            {category.target_amount
              ? `Target ${formatRupiah(category.target_amount)}`
              : "Belum ada target"}
          </p>
        )}
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