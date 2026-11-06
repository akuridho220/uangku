import { supabase } from "@/lib/supabase"
import type { Position } from "@/lib/stocks"

type Quote = { price: number | null; date: string | null; error?: string }

async function fetchQuotes(tickers: string[]): Promise<Record<string, Quote>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sesi login tidak ditemukan. Silakan masuk ulang.")

  const res = await fetch(`/api/prices?tickers=${encodeURIComponent(tickers.join(","))}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const type = res.headers.get("content-type") ?? ""
  if (!type.includes("application/json")) {
    throw new Error("Layanan harga tidak tersedia di lingkungan ini (hanya berjalan di Vercel).")
  }

  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? `Layanan harga error (${res.status}).`)
  return json.quotes as Record<string, Quote>
}

/** Mengambil harga terbaru untuk semua posisi aktif lalu menyimpannya. */
export async function refreshPositionPrices(positions: Position[]) {
  const quotes = await fetchQuotes(positions.map((p) => p.stock.ticker))
  const now = new Date().toISOString()
  const updated: string[] = []
  const failed: string[] = []

  await Promise.all(
    positions.map(async (p) => {
      const q = quotes[p.stock.ticker]
      if (!q || q.price === null || !q.date) {
        failed.push(p.stock.ticker)
        return
      }
      const { error } = await supabase
        .from("stocks")
        .update({ price: q.price, price_date: q.date, price_updated_at: now })
        .eq("id", p.stock.id)

      if (error) failed.push(p.stock.ticker)
      else updated.push(p.stock.ticker)
    })
  )

  return { updated, failed }
}