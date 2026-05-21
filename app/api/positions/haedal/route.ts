import { NextRequest, NextResponse } from "next/server"
import { SuiClient } from "@mysten/sui/client"
export const maxDuration = 30

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" })

// haSUI and haWAL coin types
const HASUI_TYPE = "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI"
const HAWAL_TYPE = "0x8b4d553839b219c3fd47608a0cc3d5fcc572cb25d41b7df3833208586a8d2470::hawal::HAWAL"

async function getTokenPrice(symbol: string): Promise<number> {
  try {
    const ids: Record<string, string> = {
      "SUI": "coingecko:sui",
      "WAL": "coingecko:walrus-2",
    }
    const id = ids[symbol]
    if (!id) return 0
    const res = await fetch(`https://coins.llama.fi/prices/current/${id}`)
    const data = await res.json()
    return data.coins?.[id]?.price ?? 0
  } catch {
    return 0
  }
}

async function getHaedalApr(): Promise<number> {
  try {
    // Get from DeFiLlama — haedal-protocol on Sui
    const res = await fetch("https://yields.llama.fi/pools")
    const data = await res.json()
    const pool = (data.data || []).find((p: any) =>
      p.chain === "Sui" && p.project === "haedal-protocol" && p.symbol?.toUpperCase().includes("HASUI")
    )
    return pool?.apy ?? 3.5 // fallback to ~3.5% typical haSUI APR
  } catch {
    return 3.5
  }
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 })

  try {
    // Get all coin balances for haSUI and haWAL
    const [hasuiCoins, hawalCoins, suiPrice, walPrice, apr] = await Promise.all([
      client.getCoins({ owner: wallet, coinType: HASUI_TYPE }),
      client.getCoins({ owner: wallet, coinType: HAWAL_TYPE }),
      getTokenPrice("SUI"),
      getTokenPrice("WAL"),
      getHaedalApr(),
    ])

    const positions = []

    // haSUI position
    const hasuiTotal = hasuiCoins.data.reduce((s, c) => s + Number(c.balance), 0)
    if (hasuiTotal > 0) {
      const amount = hasuiTotal / 1e9 // 9 decimals
      // haSUI exchange rate ~1.055 SUI (appreciates over time)
      const valueUsd = amount * suiPrice * 1.055
      positions.push({
        protocol: "Haedal",
        asset: "haSUI",
        supplyBalance: amount,
        valueUsd,
        apy: apr,
        color: "#3A9FF5",
        initials: "H",
        depositUrl: "https://www.haedal.xyz/stake",
        stakedToken: "SUI",
        exchangeRate: 1.055,
      })
    }

    // haWAL position
    const hawalTotal = hawalCoins.data.reduce((s, c) => s + Number(c.balance), 0)
    if (hawalTotal > 0) {
      const amount = hawalTotal / 1e9
      const valueUsd = amount * walPrice
      positions.push({
        protocol: "Haedal",
        asset: "haWAL",
        supplyBalance: amount,
        valueUsd,
        apy: apr,
        color: "#3A9FF5",
        initials: "H",
        depositUrl: "https://www.haedal.xyz/stake",
        stakedToken: "WAL",
        exchangeRate: 1.0,
      })
    }

    return NextResponse.json({ positions })
  } catch (err: any) {
    console.error("[Haedal positions]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}