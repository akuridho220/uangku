import type { DividendRow, StockRow, StockSettings, TradeRow } from "@/types/db"

export const SHARES_PER_LOT = 100

export type Position = {
  stock: StockRow
  lots: number
  shares: number
  cost: number // total modal posisi (termasuk biaya beli)
  avgCost: number // per lembar
  openDate: string
  buyCount: number
  price: number | null
  priceMissing: boolean
  marketValue: number
  floating: number
  floatingPct: number | null
  allocation: number // % dari total nilai pasar
  dividends: number // dividen sejak tanggal masuk posisi
}

export type ClosedTrade = {
  id: string
  stock: StockRow
  openDate: string
  sellDate: string
  days: number
  lots: number
  cost: number
  proceeds: number
  avgBuy: number
  avgSell: number
  gain: number
  pct: number | null
  note: string
}

export type Portfolio = {
  positions: Position[]
  closed: ClosedTrade[]
  warnings: string[]
  invested: number
  marketValue: number
  floating: number
  floatingPct: number | null
  dividendsTotal: number
  realized: number
  capital: number
  cash: number
  total: number
  totalPL: number
  totalPLPct: number | null
}

const toTime = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).getTime()
}

const daysBetween = (a: string, b: string) => Math.round((toTime(b) - toTime(a)) / 86_400_000)

export const dividendAmount = (d: DividendRow) => d.lots * SHARES_PER_LOT * d.per_share

type Params = {
  stocks: StockRow[]
  trades: TradeRow[]
  dividends: DividendRow[]
  settings: StockSettings
  netTransfers: number
}

export function computePortfolio({
  stocks,
  trades,
  dividends,
  settings,
  netTransfers,
}: Params): Portfolio {
  const stockById = new Map(stocks.map((s) => [s.id, s]))

  // urut tanggal; pada tanggal yang sama, beli diproses sebelum jual
  const sorted = [...trades].sort(
    (a, b) =>
      a.trade_date.localeCompare(b.trade_date) ||
      (a.side === b.side ? 0 : a.side === "buy" ? -1 : 1) ||
      a.created_at.localeCompare(b.created_at)
  )

  type State = { lots: number; cost: number; openDate: string; buyCount: number }
  const states = new Map<string, State>()
  const closed: ClosedTrade[] = []
  const warnings: string[] = []
  let tradeCash = 0

  for (const t of sorted) {
    const stock = stockById.get(t.stock_id)
    if (!stock) continue

    const gross = t.lots * SHARES_PER_LOT * t.price
    const st = states.get(t.stock_id)

    if (t.side === "buy") {
      tradeCash -= gross + t.fee
      if (!st) {
        states.set(t.stock_id, {
          lots: t.lots,
          cost: gross + t.fee,
          openDate: t.trade_date,
          buyCount: 1,
        })
      } else {
        st.lots += t.lots
        st.cost += gross + t.fee
        st.buyCount += 1
      }
      continue
    }

    if (!st || t.lots > st.lots) {
      warnings.push(
        `${stock.ticker}: penjualan ${t.lots} lot pada ${t.trade_date} melebihi kepemilikan (${st?.lots ?? 0} lot) dan diabaikan dari perhitungan.`
      )
      continue
    }

    const costBasis = (st.cost / st.lots) * t.lots
    const proceeds = gross - t.fee
    const shares = t.lots * SHARES_PER_LOT

    closed.push({
      id: t.id,
      stock,
      openDate: st.openDate,
      sellDate: t.trade_date,
      days: daysBetween(st.openDate, t.trade_date),
      lots: t.lots,
      cost: costBasis,
      proceeds,
      avgBuy: costBasis / shares,
      avgSell: proceeds / shares,
      gain: proceeds - costBasis,
      pct: costBasis > 0 ? ((proceeds - costBasis) / costBasis) * 100 : null,
      note: t.note,
    })

    tradeCash += proceeds
    st.cost -= costBasis
    st.lots -= t.lots
    if (st.lots === 0) states.delete(t.stock_id) // posisi tutup; pembelian berikutnya membuka posisi baru
  }

  const dividendsTotal = dividends.reduce((s, d) => s + dividendAmount(d), 0)

  const base = [...states.entries()].flatMap(([stockId, st]) => {
    const stock = stockById.get(stockId)
    if (!stock) return []

    const shares = st.lots * SHARES_PER_LOT
    const priceMissing = stock.price === null
    const marketValue = priceMissing ? st.cost : shares * (stock.price as number)
    const floating = marketValue - st.cost
    const posDividends = dividends
      .filter((d) => d.stock_id === stockId && d.pay_date >= st.openDate)
      .reduce((s, d) => s + dividendAmount(d), 0)

    return [
      {
        stock,
        lots: st.lots,
        shares,
        cost: st.cost,
        avgCost: st.cost / shares,
        openDate: st.openDate,
        buyCount: st.buyCount,
        price: stock.price,
        priceMissing,
        marketValue,
        floating,
        floatingPct: st.cost > 0 ? (floating / st.cost) * 100 : null,
        dividends: posDividends,
      },
    ]
  })

  const totalMarket = base.reduce((s, p) => s + p.marketValue, 0)
  const positions: Position[] = base
    .map((p) => ({ ...p, allocation: totalMarket > 0 ? (p.marketValue / totalMarket) * 100 : 0 }))
    .sort((a, b) => a.stock.ticker.localeCompare(b.stock.ticker))

  const invested = positions.reduce((s, p) => s + p.cost, 0)
  const floating = totalMarket - invested
  const capital = settings.opening_capital + netTransfers
  const cash = capital + tradeCash + dividendsTotal
  const total = totalMarket + cash

  return {
    positions,
    closed,
    warnings,
    invested,
    marketValue: totalMarket,
    floating,
    floatingPct: invested > 0 ? (floating / invested) * 100 : null,
    dividendsTotal,
    realized: closed.reduce((s, c) => s + c.gain, 0),
    capital,
    cash,
    total,
    totalPL: total - capital,
    totalPLPct: capital > 0 ? ((total - capital) / capital) * 100 : null,
  }
}