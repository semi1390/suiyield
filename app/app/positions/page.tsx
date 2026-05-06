"use client"
import { useState, useEffect } from "react"
import PositionsFetcher from "@/components/PositionsFetcher"
import { useCurrentAccount } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import { Wallet, TrendingUp, DollarSign, Calendar, Loader2, RefreshCw } from "lucide-react"
import type { RealPosition } from "@/lib/positions"

export default function PositionsPage() {
  const account = useCurrentAccount()
  const [positions, setPositions] = useState<RealPosition[]>([])
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<"live"|"empty"|"demo">("demo")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!account?.address) { setPositions([]); setSource("demo") }
  }, [account?.address])

  const handlePositions = (newPositions: RealPosition[], isLoading: boolean) => {
    setLoading(isLoading)
    if (!isLoading) {
      setPositions(newPositions)
      setSource(newPositions.length > 0 ? "live" : "empty")
      if (!isLoading) setLastUpdated(new Date())
    }
  }

  const fetchPositions = () => {} // kept for refresh button UI

  const total = positions.reduce((s, p) => s + p.valueUsd, 0)
  const dailyEarnings = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const yearlyEarnings = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100, 0)
  const avgApy = positions.length > 0 ? positions.reduce((s, p) => s + p.apy, 0) / positions.length : 0

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      {account?.address && <PositionsFetcher walletAddress={account.address} onPositions={handlePositions} />}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>My Positions</h1>
              {source === "live" && (
                <span style={{ fontSize: 10, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>LIVE</span>
              )}
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {source === "live"
                ? `Real positions on Navi & Scallop${lastUpdated ? ` · updated ${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago` : ""}`
                : "Track all your active DeFi positions across Sui protocols"}
            </p>
          </div>
          {account && (
            <button onClick={fetchPositions} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          )}
        </div>

        {!account ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Wallet size={24} style={{ color: "var(--text-muted)" }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Connect your wallet</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Connect your Sui wallet to see your real on-chain positions on Navi and Scallop.</div>
          </div>
        ) : loading ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
            <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>Reading your on-chain positions...</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Checking Navi Protocol and Scallop</div>
          </div>
        ) : source === "empty" ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>No positions found</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>This wallet has no active supply positions on Navi or Scallop.</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>More protocols (Suilend, Cetus) coming in v2.</div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { icon: DollarSign, label: "Total deposited", value: `$${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, sub: "across Navi & Scallop" },
                { icon: TrendingUp, label: "Average APY", value: `${avgApy.toFixed(2)}%`, sub: "weighted average" },
                { icon: Calendar, label: "Daily earnings", value: `$${dailyEarnings.toFixed(2)}`, sub: "estimated" },
                { icon: TrendingUp, label: "Yearly earnings", value: `$${yearlyEarnings.toFixed(0)}`, sub: "at current rates" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <s.icon size={14} style={{ color: "var(--green)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Positions table */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Active positions ({positions.length})
              </div>
              <div className="positions-table-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "8px 20px", borderBottom: "1px solid var(--border)" }}>
                {["Protocol", "Asset", "Deposited", "APY", "Daily", "Yearly"].map((h, i) => (
                  <div key={i} style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
              {positions.map((p, i) => {
                const daily = (p.valueUsd * p.apy) / 100 / 365
                const yearly = (p.valueUsd * p.apy) / 100
                return (
                  <div key={i}
                    className="positions-table-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "16px 20px", borderTop: "1px solid var(--border)", alignItems: "center", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.color + "22", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: p.color }}>
                        {p.initials}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{p.protocol}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{p.asset}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      ${p.valueUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: p.apy > 0 ? "var(--green)" : "var(--text-muted)" }}>
                      {p.apy > 0 ? `${p.apy.toFixed(2)}%` : "—"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {daily > 0 ? `+$${daily.toFixed(2)}` : "—"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {yearly > 0 ? `+$${yearly.toFixed(0)}` : "—"}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}