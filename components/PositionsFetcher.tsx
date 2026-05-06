"use client"
/**
 * Uses Noodles.fi API — Sui-native portfolio + DeFi position tracker
 * API key: dashboard.noodles.fi
 * Base URL: https://api.noodles.fi/api/v1/partner/
 * Auth: x-api-key header
 */
import { useEffect } from "react"
import type { RealPosition } from "@/lib/positions"

async function getLivePrices(): Promise<Record<string, number>> {
  try {
    const ids = "coingecko:sui,coingecko:usd-coin,coingecko:tether,coingecko:weth,coingecko:wrapped-bitcoin,coingecko:navi,coingecko:cetus-protocol"
    const res = await fetch(`https://coins.llama.fi/prices/current/${ids}`)
    const data = await res.json()
    const c = data?.coins || {}
    return {
      SUI:   c["coingecko:sui"]?.price || 3.5,
      USDC:  c["coingecko:usd-coin"]?.price || 1,
      USDT:  c["coingecko:tether"]?.price || 1,
      WETH:  c["coingecko:weth"]?.price || 3000,
      WBTC:  c["coingecko:wrapped-bitcoin"]?.price || 95000,
      LBTC:  c["coingecko:wrapped-bitcoin"]?.price || 95000,
      XBTC:  c["coingecko:wrapped-bitcoin"]?.price || 95000,
      NAVX:  c["coingecko:navi"]?.price || 0.15,
      CETUS: c["coingecko:cetus-protocol"]?.price || 0.12,
      HASUI: c["coingecko:sui"]?.price || 3.5,
      VSUI:  c["coingecko:sui"]?.price || 3.5,
      AFSUI: c["coingecko:sui"]?.price || 3.5,
      DEEP: 0.05, NS: 0.08, WAL: 0.25, HAEDAL: 0.12, BUCK: 1, SCA: 0.5,
    }
  } catch {
    return { SUI: 3.5, USDC: 1, USDT: 1, WETH: 3000, WBTC: 95000 }
  }
}

const PROTOCOL_META: Record<string, { color: string; initials: string; depositUrl: string }> = {
  navi:      { color: "#1A4FE0", initials: "N",  depositUrl: "https://app.naviprotocol.io" },
  naviprotocol: { color: "#1A4FE0", initials: "N", depositUrl: "https://app.naviprotocol.io" },
  scallop:   { color: "#8B5CF6", initials: "Sc", depositUrl: "https://app.scallop.io" },
  cetus:     { color: "#06B6D4", initials: "C",  depositUrl: "https://app.cetus.zone/liquidity" },
  suilend:   { color: "#EC4899", initials: "Sl", depositUrl: "https://app.suilend.fi" },
  aftermath: { color: "#EF4444", initials: "Af", depositUrl: "https://aftermath.finance" },
  turbos:    { color: "#F97316", initials: "T",  depositUrl: "https://app.turbos.finance" },
  haedal:    { color: "#6366F1", initials: "H",  depositUrl: "https://app.haedal.xyz" },
  bluefin:   { color: "#2563EB", initials: "Bf", depositUrl: "https://app.bluefin.io" },
  current:   { color: "#0EA5E9", initials: "Cu", depositUrl: "https://app.current.finance" },
}

interface Props {
  walletAddress: string
  onPositions: (positions: RealPosition[], loading: boolean) => void
}

export default function PositionsFetcher({ walletAddress, onPositions }: Props) {
  useEffect(() => {
    if (!walletAddress) return
    onPositions([], true)

    async function fetchPositions() {
            try {
        const prices = await getLivePrices()

        // Calls our server-side route — API key never exposed to browser
        const res = await fetch(`/api/portfolio?address=${walletAddress}`)
        console.log("[Noodles] Status:", res.status)

        if (!res.ok) {
          // Position data not available yet — silently return empty
          onPositions([], false)
          return
        }

        const result = await res.json()
        const data = result?.data?.data || result?.data || {}
        console.log("[Noodles] Response:", JSON.stringify(data).slice(0, 600))

        const positions: RealPosition[] = []

        // Parse DeFi positions — Noodles likely returns lending/LP positions
        const defiPositions = data?.defi || data?.protocols || data?.positions || []

        for (const proto of defiPositions) {
          const protocolKey = (proto.protocol || proto.name || "").toLowerCase()
            .replace(/[^a-z]/g, "")
          const meta = PROTOCOL_META[protocolKey] || {
            color: "#4B5563",
            initials: protocolKey.charAt(0).toUpperCase() || "?",
            depositUrl: "https://defillama.com/yields?chain=Sui"
          }

          // Lending/supply positions
          const supplies = proto.supplyPositions || proto.lending ||
                           proto.supplies || proto.lendPositions || []
          for (const pos of supplies) {
            const sym = (pos.symbol || pos.coinSymbol || "").toUpperCase()
            const amount = parseFloat(pos.amount || pos.supplyBalance || pos.balance || 0)
            const valueUsd = parseFloat(pos.valueUsd || pos.usdValue || 0) || (amount * (prices[sym] || 1))
            const apy = parseFloat(pos.apy || pos.supplyApy || pos.supplyRate || 0)
            if (valueUsd < 0.001) continue
            positions.push({
              protocol: proto.protocol || proto.name || protocolKey,
              asset: sym, supplyBalance: amount, valueUsd, apy,
              color: meta.color, initials: meta.initials, depositUrl: meta.depositUrl
            })
          }

          // LP positions
          const lps = proto.lpPositions || proto.liquidity || proto.pools || []
          for (const pos of lps) {
            const sym = pos.symbol || pos.pairName ||
              (pos.coins || []).map((c: any) => c.symbol).join("/") || "LP"
            const valueUsd = parseFloat(pos.valueUsd || pos.usdValue || pos.value || 0)
            if (valueUsd < 0.001) continue
            positions.push({
              protocol: proto.protocol || proto.name || protocolKey,
              asset: sym, supplyBalance: valueUsd, valueUsd,
              apy: parseFloat(pos.apr || pos.apy || 0),
              color: meta.color, initials: meta.initials, depositUrl: meta.depositUrl
            })
          }
        }

        console.log("[Noodles] Positions found:", positions.length)
        onPositions(positions, false)
      } catch (err) {
        console.error("[Noodles] Error:", err)
        onPositions([], false)
      }
    }

    fetchPositions()
  }, [walletAddress])

  return null
}