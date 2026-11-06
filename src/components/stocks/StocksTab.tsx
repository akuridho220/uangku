import { useEffect, useMemo, useRef, useState } from "react"
import { RefreshCw, Settings2 } from "lucide-react"
import { useAccounts } from "@/hooks/useAccounts"
import { useStockData } from "@/hooks/useStockData"
import { formatRupiah } from "@/lib/format"
import { refreshPositionPrices } from "@/lib/live-prices"
import { computePortfolio, type Position } from "@/lib/stocks"
import type { DividendRow, TradeRow } from "@/types/db"
import { Button } from "@/components/ui/button"
import { ClosedSection } from "./ClosedSection"
import { DepositSection } from "./DepositSection"
import { DividendDialog } from "./DividendDialog"
import { DividendSection } from "./DividendSection"
import { PositionsSection } from "./PositionsSection"
import { PricesDialog } from "./PricesDialog"
import { SettingsDialog } from "./SettingsDialog"
import { StockSummary } from "./StockSummary"
import { TradeDialog } from "./TradeDialog"
import { TradeLog } from "./TradeLog"

const REFRESH_AFTER_MS = 30 * 60 * 1000
const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" })

function newestPriceUpdate(positions: Position[]) {
  const times = positions
    .map((p) => p.stock.price_updated_at)
    .filter((t): t is string => !!t)
    .map((t) => new Date(t).getTime())
  return times.length > 0 ? Math.max(...times) : 0
}

export function StocksTab() {
  const data = useStockData()
  const acc = useAccounts()

  const rdn = data.settings.rdn_account_id
  const netTransfers = useMemo(
    () =>
      data.transfers.reduce(
        (sum, t) =>
          sum + (t.account_in_id === rdn ? t.amount : 0) - (t.account_out_id === rdn ? t.amount : 0),
        0
      ),
    [data.transfers, rdn]
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

  const [tradeOpen, setTradeOpen] = useState(false)
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy")
  const [editingTrade, setEditingTrade] = useState<TradeRow | null>(null)
  const [dividendOpen, setDividendOpen] = useState(false)
  const [editingDividend, setEditingDividend] = useState<DividendRow | null>(null)
  const [pricesOpen, setPricesOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [priceMessage, setPriceMessage] = useState<string | null>(null)
  const autoTried = useRef(false)

  async function refreshPrices() {
    if (portfolio.positions.length === 0) return
    setRefreshing(true)
    setPriceMessage(null)
    try {
      const { failed } = await refreshPositionPrices(portfolio.positions)
      await data.refresh()
      setPriceMessage(
        failed.length === 0
          ? "Harga berhasil diperbarui."
          : `Gagal memperbarui: ${failed.join(", ")}. Isi manual lewat Isi harga manual.`
      )
    } catch (e) {
      setPriceMessage(e instanceof Error ? e.message : "Gagal memperbarui harga.")
    }
    setRefreshing(false)
  }

  // Pembaruan otomatis sekali saat tab dibuka, jika data harga sudah lebih dari 30 menit
  useEffect(() => {
    if (data.loading || autoTried.current) return
    autoTried.current = true
    if (
      portfolio.positions.length > 0 &&
      Date.now() - newestPriceUpdate(portfolio.positions) > REFRESH_AFTER_MS
    ) {
      void refreshPrices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.loading])

  function openTrade(side: "buy" | "sell", trade: TradeRow | null = null) {
    setTradeSide(side)
    setEditingTrade(trade)
    setTradeOpen(true)
  }

  function openDividend(dividend: DividendRow | null = null) {
    setEditingDividend(dividend)
    setDividendOpen(true)
  }

  if (data.loading || acc.loading) return <p className="text-sm text-muted-foreground">Memuat…</p>
  if (data.error || acc.error) {
    return <p className="text-sm text-destructive">Gagal memuat: {data.error ?? acc.error}</p>
  }

  const newest = newestPriceUpdate(portfolio.positions)

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => openTrade("buy")}>Beli</Button>
          <Button variant="outline" onClick={() => openTrade("sell")}>
            Jual
          </Button>
          <Button variant="outline" onClick={() => openDividend()}>
            Dividen
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={refreshPrices}
            disabled={refreshing || portfolio.positions.length === 0}
          >
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            {refreshing ? "Memperbarui…" : "Perbarui harga"}
          </Button>
          <Button variant="ghost" onClick={() => setPricesOpen(true)}>
            Isi harga manual
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            aria-label="Pengaturan saham"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>

        {priceMessage && <p className="text-sm text-muted-foreground">{priceMessage}</p>}

        {!rdn && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            Account RDN belum dipilih. Buka Pengaturan (ikon gerigi) agar Modal Disetor dan Sisa
            Cash dihitung dengan benar.
          </div>
        )}

        {portfolio.warnings.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
            {portfolio.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        <StockSummary portfolio={portfolio} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Posisi Aktif</h2>
          <p className="text-sm text-muted-foreground">
            Harga kini diambil otomatis dari Yahoo Finance (tertunda beberapa menit dari bursa;
            di luar jam bursa berupa harga penutupan terakhir).
            {newest > 0 && ` Terakhir diperbarui ${dateTime.format(new Date(newest))}.`} Akum.
            dividen per baris = dividen yang diterima sejak tanggal masuk posisi.
          </p>
        </div>
        <PositionsSection positions={portfolio.positions} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Saham yang Telah Dijual</h2>
          <p className="text-sm text-muted-foreground">
            Dikelompokkan per tahun penjualan. Total gain/loss sudah setelah biaya transaksi.
          </p>
        </div>
        <ClosedSection closed={portfolio.closed} />
      </section>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Penerimaan Dividen</h2>
            <p className="text-sm text-muted-foreground">
              Total dividen diterima sejak portofolio ini dibuat:{" "}
              <span className="font-medium text-green-600">
                {formatRupiah(portfolio.dividendsTotal)}
              </span>
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => openDividend()}>
            Tambah
          </Button>
        </div>
        <DividendSection
          dividends={data.dividends}
          stocks={data.stocks}
          portfolio={portfolio}
          onEdit={(d) => openDividend(d)}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Riwayat Deposit</h2>
          <p className="text-sm text-muted-foreground">
            Diambil dari Transfer ke account RDN di menu Transaksi. Total modal disetor:{" "}
            <span className="font-medium">{formatRupiah(portfolio.capital)}</span>
          </p>
        </div>
        <DepositSection
          transfers={data.transfers}
          rdnId={rdn}
          openingCapital={data.settings.opening_capital}
          accounts={acc.accounts}
          total={portfolio.capital}
        />
      </section>

      <TradeLog trades={data.trades} stocks={data.stocks} onEdit={(t) => openTrade(t.side, t)} />

      <TradeDialog
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        trade={editingTrade}
        side={tradeSide}
        stocks={data.stocks}
        portfolio={portfolio}
        onSaved={data.refresh}
      />

      <DividendDialog
        open={dividendOpen}
        onOpenChange={setDividendOpen}
        dividend={editingDividend}
        stocks={data.stocks}
        portfolio={portfolio}
        onSaved={data.refresh}
      />

      <PricesDialog
        open={pricesOpen}
        onOpenChange={setPricesOpen}
        positions={portfolio.positions}
        onSaved={data.refresh}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={data.settings}
        accounts={acc.accounts}
        onSaved={data.refresh}
      />
    </div>
  )
}