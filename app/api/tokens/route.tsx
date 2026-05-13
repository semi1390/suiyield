import { NextResponse } from "next/server"

let cache: { data: any[]; ts: number } | null = null
const CACHE_MS = 10 * 60 * 1000 // 10 min

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json({ tokens: cache.data })
  }
  try {
    // Navi's public token list API
    const res = await fetch("https://api-aggregator.naviprotocol.io/tokens", {
      headers: { "Accept": "application/json" },
      next: { revalidate: 600 }
    })
    if (!res.ok) throw new Error("Failed to fetch token list")
    const data = await res.json()
    cache = { data: data?.tokens ?? data ?? [], ts: Date.now() }
    return NextResponse.json({ tokens: cache.data })
  } catch (e) {
    // Fallback to hardcoded list
    return NextResponse.json({ tokens: FALLBACK_TOKENS })
  }
}

const FALLBACK_TOKENS = [
  { symbol: "SUI",   name: "Sui",         coinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",  decimals: 9 },
  { symbol: "USDC",  name: "USD Coin",    coinType: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", decimals: 6 },
  { symbol: "USDT",  name: "Tether",      coinType: "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT", decimals: 6 },
  { symbol: "DEEP",  name: "DeepBook",    coinType: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP", decimals: 6 },
  { symbol: "WETH",  name: "Wrapped ETH", coinType: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN", decimals: 8 },
  { symbol: "CETUS", name: "Cetus",       coinType: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS", decimals: 9 },
  { symbol: "WAL",   name: "Walrus",      coinType: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",   decimals: 9 },
  { symbol: "NAVX",  name: "Navi",        coinType: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX", decimals: 9 },
]