import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { formatRupiah } from "@/lib/format"
import { tooltipStyle } from "./chart-style"

const COLORS = ["#2563eb", "#ea580c", "#16a34a", "#7c3aed", "#db2777", "#0d9488", "#6b7280"]

type Props = { data: { name: string; value: number }[] }

export function ExpensePie({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, 6)
  const rest = sorted.slice(6).reduce((sum, d) => sum + d.value, 0)
  const slices = rest > 0 ? [...top, { name: "Lainnya", value: rest }] : top
  const total = slices.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Belum ada pengeluaran bulan ini.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full space-y-2 text-sm">
        {slices.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatRupiah(s.value)} · {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}