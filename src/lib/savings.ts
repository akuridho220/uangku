import { todayISO } from "@/lib/date"
import type { CategoryRow, TransactionRow, ValuationRow } from "@/types/db"

export type HistoryRow = {
  id: string
  date: string
  value: number
  expected: number
  gain: number
}

export type SeriesPoint = { date: string; t: number; value: number; capital: number }

export type PotStats = {
  configured: boolean
  startDate: string | null
  opening: number
  deposits: number
  withdrawals: number
  capital: number
  value: number
  gain: number
  gainPct: number | null
  lastValuationDate: string | null
  history: HistoryRow[]
  series: SeriesPoint[]
}

const toTime = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).getTime()
}

/** Arus bersih (setoran − pencairan) dengan after < tanggal <= until. */
function netFlow(flows: TransactionRow[], after: string, until: string | null) {
  let sum = 0
  for (const t of flows) {
    if (t.tx_date <= after) continue
    if (until !== null && t.tx_date > until) continue
    sum += t.account_in_id ? -t.amount : t.amount
  }
  return sum
}

/** Titik-titik untuk grafik: nilai dan modal pada setiap tanggal ada kejadian, plus hari ini. */
function buildSeries(
  startDate: string,
  opening: number,
  own: TransactionRow[],
  vals: ValuationRow[]
): SeriesPoint[] {
  let value = opening
  let capital = opening
  const points: SeriesPoint[] = [{ date: startDate, t: toTime(startDate), value, capital }]

  const dates = new Set<string>()
  for (const t of own) if (t.tx_date > startDate) dates.add(t.tx_date)
  for (const v of vals) dates.add(v.val_date)

  for (const date of [...dates].sort()) {
    if (date > startDate) {
      for (const t of own) {
        if (t.tx_date !== date) continue
        const delta = t.account_in_id ? -t.amount : t.amount
        value += delta
        capital += delta
      }
    }
    const sameDay = vals.filter((v) => v.val_date === date)
    if (sameDay.length > 0) value = sameDay[sameDay.length - 1].value

    if (date === startDate) points[0] = { ...points[0], value }
    else points.push({ date, t: toTime(date), value, capital })
  }

  const today = todayISO()
  const last = points[points.length - 1]
  if (today > last.date) points.push({ date: today, t: toTime(today), value, capital })

  return points
}

export function computePot(
  category: CategoryRow,
  flows: TransactionRow[],
  valuations: ValuationRow[]
): PotStats {
  const startDate = category.start_date

  if (!startDate) {
    return {
      configured: false,
      startDate: null,
      opening: 0,
      deposits: 0,
      withdrawals: 0,
      capital: 0,
      value: 0,
      gain: 0,
      gainPct: null,
      lastValuationDate: null,
      history: [],
      series: [],
    }
  }

  const own = flows.filter((t) => t.category_id === category.id)
  const vals = valuations
    .filter((v) => v.category_id === category.id && v.val_date >= startDate)
    .sort((a, b) => a.val_date.localeCompare(b.val_date) || a.created_at.localeCompare(b.created_at))

  let prevDate = startDate
  let prevValue = category.opening_value
  const history: HistoryRow[] = []

  for (const v of vals) {
    const expected = prevValue + netFlow(own, prevDate, v.val_date)
    history.push({ id: v.id, date: v.val_date, value: v.value, expected, gain: v.value - expected })
    prevDate = v.val_date
    prevValue = v.value
  }

  const value = prevValue + netFlow(own, prevDate, null)

  let deposits = 0
  let withdrawals = 0
  for (const t of own) {
    if (t.tx_date <= startDate) continue
    if (t.account_in_id) withdrawals += t.amount
    else deposits += t.amount
  }

  const capital = category.opening_value + deposits - withdrawals
  const gain = value - capital

  return {
    configured: true,
    startDate,
    opening: category.opening_value,
    deposits,
    withdrawals,
    capital,
    value,
    gain,
    gainPct: capital > 0 ? (gain / capital) * 100 : null,
    lastValuationDate: vals.length > 0 ? vals[vals.length - 1].val_date : null,
    history,
    series: buildSeries(startDate, category.opening_value, own, vals),
  }
}