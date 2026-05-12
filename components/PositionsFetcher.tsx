"use client"
import { useEffect } from "react"
import type { RealPosition } from "@/lib/positions"

const PROTOCOL_META: Record<string, { color: string; initials: string; depositUrl: string }> = {
  navi:    { color: "#1A4FE0", initials: "N",  depositUrl: "https://app.naviprotocol.io" },
  scallop: { color: "#8B5CF6", initials: "Sc", depositUrl: "https://app.scallop.io" },
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
        const [naviRes, scallopRes] = await Promise.allSettled([
          fetch(`/api/positions/navi?address=${walletAddress}`).then(r => r.json()),
          fetch(`/api/positions/scallop?address=${walletAddress}`).then(r => r.json()),
        ])

        const positions: RealPosition[] = []

        if (naviRes.status === "fulfilled" && naviRes.value?.positions) {
          positions.push(...naviRes.value.positions)
        }
        if (scallopRes.status === "fulfilled" && scallopRes.value?.positions) {
          positions.push(...scallopRes.value.positions)
        }

        console.log("[Positions] Total found:", positions.length)
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