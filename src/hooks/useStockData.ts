import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type {
  DividendRow,
  StockRow,
  StockSettings,
  TradeRow,
  TransactionRow,
} from "@/types/db"

export function useStockData() {
  const [settings, setSettings] = useState<StockSettings>({
    rdn_account_id: null,
    opening_capital: 0,
  })
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [dividends, setDividends] = useState<DividendRow[]>([])
  const [transfers, setTransfers] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const s = await supabase.from("stock_settings").select("*").maybeSingle()
      if (s.error) throw new Error(s.error.message)
      const rdn: string | null = s.data?.rdn_account_id ?? null

      const [st, tr, dv, tf] = await Promise.all([
        supabase.from("stocks").select("*").order("ticker"),
        supabase.from("stock_trades").select("*").order("trade_date").order("created_at"),
        supabase.from("stock_dividends").select("*").order("pay_date"),
        rdn
          ? supabase
              .from("transactions")
              .select("*")
              .is("category_id", null)
              .or(`account_in_id.eq.${rdn},account_out_id.eq.${rdn}`)
              .order("tx_date")
          : Promise.resolve({ data: [] as TransactionRow[], error: null }),
      ])

      for (const r of [st, tr, dv, tf]) {
        if (r.error) throw new Error(r.error.message)
      }

      setSettings({
        rdn_account_id: rdn,
        opening_capital: s.data?.opening_capital ?? 0,
      })
      setStocks(st.data as StockRow[])
      setTrades(tr.data as TradeRow[])
      setDividends(dv.data as DividendRow[])
      setTransfers(tf.data as TransactionRow[])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data saham.")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { settings, stocks, trades, dividends, transfers, loading, error, refresh }
}