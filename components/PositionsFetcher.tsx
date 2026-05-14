"use client"
import { useEffect } from "react"
import type { RealPosition } from "@/lib/positions"

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
        const [naviRes, scallopRes, cetusRes] = await Promise.allSettled([
          fetch(`/api/positions/navi?address=${walletAddress}`).then(r => r.json()),
          fetch(`/api/positions/scallop?address=${walletAddress}`).then(r => r.json()),
          fetch(`/api/positions/cetus?wallet=${walletAddress}`).then(r => r.json()),
        ])

        const positions: RealPosition[] = []

        if (naviRes.status === "fulfilled" && naviRes.value?.positions) {
          positions.push(...naviRes.value.positions)
        }
        if (scallopRes.status === "fulfilled" && scallopRes.value?.positions) {
          positions.push(...scallopRes.value.positions)
        }
        if (cetusRes.status === "fulfilled" && cetusRes.value?.positions) {
          // Map Cetus positions to RealPosition shape
          for (const p of cetusRes.value.positions) {
            positions.push({
              protocol: "Cetus",
              asset: p.asset,
              supplyBalance: p.amountA,      // primary token amount
              valueUsd: 0,                    // we don't have USD value yet
              apy: 0,                         // CLMM has no fixed APY
              color: "#06B6D4",
              initials: "C",
              depositUrl: "https://app.cetus.zone/pools",
              // Cetus-specific extras
              amountA: p.amountA,
              amountB: p.amountB,
              symbolA: p.symbolA,
              symbolB: p.symbolB,
              inRange: p.inRange,
              feeA: p.feeA,
              feeB: p.feeB,
              poolAddress: p.poolAddress,
              positionId: p.id,
            } as any)
          }
        }

        console.log("[Positions] Total found:", positions.length, { navi: naviRes.status, scallop: scallopRes.status, cetus: cetusRes.status })
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