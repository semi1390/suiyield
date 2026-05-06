import { NextResponse } from "next/server"

// In-memory cache per wallet — persists for the lifetime of the server process
const _cache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes — well within the 5 req/min limit

// Simple in-memory rate limiter — max 10 requests per IP per minute
const _rateLimits = new Map<string, { count: number; ts: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = _rateLimits.get(ip)
  if (!entry || now - entry.ts > 60000) {
    _rateLimits.set(ip, { count: 1, ts: now })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")

  if (!address || !address.startsWith("0x")) {
    return NextResponse.json({ error: "Valid address required" }, { status: 400 })
  }

  // Serve from cache if fresh
  const cached = _cache.get(address)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    console.log(`[Portfolio Cache] Hit for ${address.slice(0, 10)}...`)
    return NextResponse.json({ ...cached.data, cached: true })
  }

  const key = process.env.NOODLES_API_KEY || ""
  if (!key) {
    return NextResponse.json({ error: "No Noodles API key configured" }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.noodles.fi/api/v1/partner/account/coin-holdings?address=${address}`,
      {
        headers: { "x-api-key": key, "Accept": "application/json" },
        signal: AbortSignal.timeout(10000)
      }
    )

    console.log(`[Portfolio] Noodles status: ${res.status}`)

    if (!res.ok) {
      const err = await res.text()
      console.log(`[Portfolio] Noodles error:`, err)
      // If we have stale cache, return it rather than failing
      if (cached) {
        console.log(`[Portfolio] Returning stale cache as fallback`)
        return NextResponse.json({ ...cached.data, cached: true, stale: true })
      }
      return NextResponse.json({ error: "Noodles API failed", detail: err }, { status: res.status })
    }

    const data = await res.json()
    const result = { data, fetchedAt: new Date().toISOString() }

    _cache.set(address, { data: result, ts: Date.now() })
    console.log(`[Portfolio] Cached fresh data for ${address.slice(0, 10)}...`)

    return NextResponse.json({ ...result, cached: false })
  } catch (err) {
    console.error("[Portfolio] Error:", err)
    // Return stale cache if available
    if (cached) {
      return NextResponse.json({ ...cached.data, cached: true, stale: true })
    }
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
  }
}