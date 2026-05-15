"use client"
import type { RealPosition } from "@/lib/positions"
import { Eye, Loader2, ArrowRight } from "lucide-react"
import { ConnectButton } from "@mysten/dapp-kit"
import Link from "next/link"

interface Props {
  positions: RealPosition[]
  connected: boolean
  loading?: boolean
  source?: "live" | "empty" | "demo"
}

export default function PositionsPanel({ positions, connected, loading, source }: Props) {
  const lendingPositions = positions.filter(p => p.protocol !== "Cetus")
  const total = positions.reduce((s, p) => s + p.valueUsd, 0)
  const daily = lendingPositions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const getPositionLabel = (p: RealPosition) => {
    if (p.protocol === "Cetus") return "DEX LP · Fee-based"
    if (p.protocol === "Haedal") return `Staking · ${p.apy.toFixed(2)}% APY`
    return `Lending · ${p.apy.toFixed(2)}% APY`
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>My Positions</span>
          <Eye size={13} style={{ color: "var(--text-muted)" }} />
          {source === "live" && (
            <span style={{ fontSize: 10, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>
              LIVE
            </span>
          )}
        </div>
        <Link href="/app/positions" style={{ fontSize: 12, color: "var(--green)", textDecoration: "none", fontWeight: 500 }}>
          View all
        </Link>
      </div>

      {!connected ? (
        <div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>Connect wallet to view your positions</p>
          <div style={{ width: "100%" }}><ConnectButton /></div>
        </div>

      ) : loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Reading on-chain positions...
        </div>

      ) : positions.length === 0 ? (
        <div style={{ padding: "16px 0", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>No positions found</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Checking Navi · Scallop · Cetus · Haedal</p>
        </div>

      ) : (
        <>
          {/* Summary row */}
          {total > 0 && (
            <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Total value</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>${fmt(total)}</div>
              </div>
              {daily > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Daily earnings</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>+${fmt(daily)}</div>
                </div>
              )}
            </div>
          )}

          {/* Position rows */}
          {positions.slice(0, 4).map((p, i) => (
            <div key={i}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.color + "22", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: p.color, flexShrink: 0 }}>
                  {p.initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                    {p.asset} · {p.protocol.replace(" Protocol", "")}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {getPositionLabel(p)}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                  ${fmt(p.valueUsd)}
                </div>
                <div style={{ fontSize: 11, color: p.protocol === "Cetus" ? "#06B6D4" : "var(--green)", fontWeight: 500 }}>
                  {p.protocol === "Cetus" ? "Fee-based" : `${p.apy.toFixed(2)}%`}
                </div>
              </div>
            </div>
          ))}

          {positions.length > 4 && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
              +{positions.length - 4} more positions
            </div>
          )}

          <Link href="/app/positions"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--green)", textDecoration: "none", fontWeight: 500 }}>
            View all positions <ArrowRight size={12} />
          </Link>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}