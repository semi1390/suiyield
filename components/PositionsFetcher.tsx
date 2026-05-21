"use client"
import { useEffect } from "react"
import type { RealPosition } from "@/lib/positions"

interface Props {
  walletAddress: string
  onPositions: (positions: RealPosition[], loading: boolean) => void
}

const POSITIONS_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

async function fetchWithTimeout(url: string, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error(`Timeout after ${timeoutMs}ms`)
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export default function PositionsFetcher({ walletAddress, onPositions }: Props) {
  useEffect(() => {
    if (!walletAddress) return

    const cacheKey = `suiyield_positions_${walletAddress}`

    // Try cache first — show immediately without loading
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const { positions, ts } = JSON.parse(cached)
        if (Date.now() - ts < POSITIONS_CACHE_TTL) {
          onPositions(positions, false)
          return // use cache, skip fetch
        }
      }
    } catch {}

    // No cache — fetch fresh
    onPositions([], true)

    async function fetchPositions() {
      try {
       const [naviRes, scallopRes, cetusRes, haedalRes] = await Promise.allSettled([
  fetchWithTimeout(`/api/positions/navi?address=${walletAddress}`, 30000),
  fetchWithTimeout(`/api/positions/scallop?address=${walletAddress}`, 30000),
  fetchWithTimeout(`/api/positions/cetus?wallet=${walletAddress}`, 40000),
  fetchWithTimeout(`/api/positions/haedal?wallet=${walletAddress}`, 30000),
])

        const positions: RealPosition[] = []

        if (naviRes.status === "fulfilled" && naviRes.value?.positions) {
          positions.push(...naviRes.value.positions)
        } else if (naviRes.status === "rejected") {
          console.warn("[Positions] Navi failed:", naviRes.reason)
        }

        if (scallopRes.status === "fulfilled" && scallopRes.value?.positions) {
          positions.push(...scallopRes.value.positions)
        } else if (scallopRes.status === "rejected") {
          console.warn("[Positions] Scallop failed:", scallopRes.reason)
        }

        if (cetusRes.status === "fulfilled" && cetusRes.value?.positions) {
          for (const p of cetusRes.value.positions) {
            positions.push({
              protocol: "Cetus",
              asset: p.asset,
              name: p.name,
              supplyBalance: p.amountA ?? 0,
              valueUsd: p.valueUsd ?? 0,
              apy: p.apy ?? 0,
              apyDisplay: p.apy ?? 0,
              color: "#06B6D4",
              initials: "C",
              depositUrl: "https://app.cetus.zone/pools",
              amountA: p.amountA,
              amountB: p.amountB,
              symbolA: p.symbolA,
              symbolB: p.symbolB,
              inRange: p.inRange,
              feeA: p.feeA,
              feeB: p.feeB,
              priceA: p.priceA,
              priceB: p.priceB,
              poolAddress: p.poolAddress,
              positionId: p.id,
            } as any)
          }
        } else if (cetusRes.status === "rejected") {
          console.warn("[Positions] Cetus failed:", cetusRes.reason)
        }

        if (haedalRes.status === "fulfilled" && haedalRes.value?.positions) {
          positions.push(...haedalRes.value.positions)
        } else if (haedalRes.status === "rejected") {
          console.warn("[Positions] Haedal failed:", haedalRes.reason)
        }

        console.log("[Positions] Total found:", positions.length, {
          navi: naviRes.status,
          scallop: scallopRes.status,
          cetus: cetusRes.status,
          haedal: haedalRes.status,
        })

        // Save to cache
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ positions, ts: Date.now() }))
        } catch {}

        onPositions(positions, false)
      } catch (err) {
        console.error("[Positions] Error:", err)
        onPositions([], false)
      }
    }

    fetchPositions()
  }, [walletAddress])

  return null
}