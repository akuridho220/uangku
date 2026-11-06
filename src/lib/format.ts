const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

export const formatRupiah = (n: number) => rupiah.format(n)

const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export const formatCompact = (n: number) => compact.format(n)

const pct = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatPercent = (n: number) => `${n > 0 ? "+" : ""}${pct.format(n)}%`