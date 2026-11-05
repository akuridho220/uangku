import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCompact, formatRupiah } from "@/lib/format"
import { tooltipStyle } from "./chart-style"

type Props = { data: { day: number; total: number }[] }

const tick = { fontSize: 11, fill: "var(--muted-foreground)" }

export function DailyBars({ data }: Props) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={tick}
            interval="preserveStartEnd"
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tick={tick}
            tickFormatter={(v) => formatCompact(Number(v))}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(v) => [formatRupiah(Number(v)), "Pengeluaran"]}
            labelFormatter={(l) => `Tanggal ${l}`}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="total" fill="var(--primary)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}