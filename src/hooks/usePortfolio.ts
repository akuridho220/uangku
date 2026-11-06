import { useMemo } from "react"
import { useStockData } from "@/hooks/useStockData"
import { computePortfolio } from "@/lib/stocks"

export function usePortfolio() {
  const data = useStockData()
  const rdnId = data.settings.rdn_account_id

  const netTransfers = useMemo(
    () =>
      data.transfers.reduce(
        (sum, t) =>
          sum + (t.account_in_id === rdnId ? t.amount : 0) - (t.account_out_id === rdnId ? t.amount : 0),
        0
      ),
    [data.transfers, rdnId]
  )

  const portfolio = useMemo(
    () =>
      computePortfolio({
        stocks: data.stocks,
        trades: data.trades,
        dividends: data.dividends,
        settings: data.settings,
        netTransfers,
      }),
    [data.stocks, data.trades, data.dividends, data.settings, netTransfers]
  )

  return { portfolio, rdnId, loading: data.loading, error: data.error }
}