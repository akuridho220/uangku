import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCompact, formatRupiah } from "@/lib/format"
import type { SeriesPoint } from "@/lib/savings"
import { tooltipStyle } from "@/components/dashboard/chart-style"

const tick = { fontSize: 11, fill: "var(--muted-foreground)" }
const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" })
const longDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" })

export function ValueChart({ series }: { series: SeriesPoint[] }) {
  if (series.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Belum cukup data untuk grafik. Grafik muncul setelah ada setoran atau update nilai.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t) => shortDate.format(new Date(Number(t)))}
              tickLine={false}
              axisLine={false}
              tick={tick}
            />
            <YAxis
              width={52}
              domain={["auto", "auto"]}
              tickLine={false}
              axisLine={false}
              tick={tick}
              tickFormatter={(v) => formatCompact(Number(v))}
            />
            <Tooltip
              labelFormatter={(t) => longDate.format(new Date(Number(t)))}
              formatter={(v) => formatRupiah(Number(v))}
              contentStyle={tooltipStyle}
            />
            <Line
              name="Modal"
              dataKey="capital"
              type="stepAfter"
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              name="Nilai"
              dataKey="value"
              type="linear"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-primary" /> Nilai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-muted-foreground" /> Modal
        </span>
      </div>
    </div>
  )
}