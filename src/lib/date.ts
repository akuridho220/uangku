const pad = (n: number) => String(n).padStart(2, "0")

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function currentMonthKey() {
  return todayISO().slice(0, 7)
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthRange(key: string) {
  return { from: `${key}-01`, to: `${shiftMonth(key, 1)}-01` }
}

export function formatMonthLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  )
}

export function formatDateLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d))
}

export function formatDateShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d))
}

export function daysInMonth(key: string) {
  const [y, m] = key.split("-").map(Number)
  return new Date(y, m, 0).getDate()
}