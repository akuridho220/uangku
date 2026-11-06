import type { VercelRequest, VercelResponse } from "@vercel/node"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

type Quote = { price: number | null; date: string | null; error?: string }

// Hanya pengguna yang login ke Supabase-mu yang boleh memakai fungsi ini.
async function isAuthorized(authHeader: string | undefined) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!authHeader || !url || !key) return false

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: key },
  })
  return res.ok
}

async function fetchQuote(ticker: string): Promise<Quote> {
  let lastError = "Tidak diketahui"

  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${ticker}.JK?range=1d&interval=1d`,
        { headers: { "User-Agent": UA, Accept: "application/json" } }
      )
      if (!res.ok) {
        lastError = `Sumber data menjawab HTTP ${res.status}`
        continue
      }

      const json = await res.json()
      const meta = json?.chart?.result?.[0]?.meta
      const price = meta?.regularMarketPrice
      const time = meta?.regularMarketTime

      if (typeof price !== "number" || typeof time !== "number") {
        lastError = "Data harga tidak tersedia"
        continue
      }

      // tanggal perdagangan dalam zona waktu Jakarta (format YYYY-MM-DD)
      const date = new Date(time * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
      return { price: Math.round(price), date }
    } catch {
      lastError = "Gagal menghubungi sumber data"
    }
  }

  return { price: null, date: null, error: lastError }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAuthorized(req.headers.authorization))) {
    return res.status(401).json({ error: "Tidak diizinkan" })
  }

  const tickers = [
    ...new Set(
      String(req.query.tickers ?? "")
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
    ),
  ]

  if (tickers.length === 0 || tickers.length > 20) {
    return res.status(400).json({ error: "Isi 1 sampai 20 kode saham." })
  }
  if (tickers.some((t) => !/^[A-Z0-9]{2,8}$/.test(t))) {
    return res.status(400).json({ error: "Kode saham tidak valid." })
  }

  // satu per satu dengan jeda kecil agar tidak memicu pembatasan laju
  const quotes: Record<string, Quote> = {}
  for (const t of tickers) {
    quotes[t] = await fetchQuote(t)
    await new Promise((r) => setTimeout(r, 150))
  }

  res.setHeader("Cache-Control", "no-store")
  return res.status(200).json({ quotes })
}