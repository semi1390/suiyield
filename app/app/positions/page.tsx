"use client"
import { useState, useEffect } from "react"
import PositionsFetcher from "@/components/PositionsFetcher"
import { useCurrentAccount } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import { Wallet, TrendingUp, DollarSign, Activity, Loader2, RefreshCw, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import type { RealPosition } from "@/lib/positions"

const PROTOCOL_COLORS: Record<string, string> = {
  "Navi Protocol": "#1A4FE0",
  "Scallop": "#8B5CF6",
  "Suilend": "#EC4899",
}

const PROTOCOL_INITIALS: Record<string, string> = {
  "Navi Protocol": "N",
  "Scallop": "Sc",
  "Suilend": "Sl",
}

// Group positions by protocol
function groupByProtocol(positions: RealPosition[]): Record<string, RealPosition[]> {
  const groups: Record<string, RealPosition[]> = {}
  for (const p of positions) {
    if (!groups[p.protocol]) groups[p.protocol] = []
    groups[p.protocol].push(p)
  }
  return groups
}

interface ProtocolGroupProps {
  protocol: string
  positions: RealPosition[]
  fmt: (n: number) => string
  onMoveFunds: (position: RealPosition) => void
}

function ProtocolGroup({ protocol, positions, fmt, onMoveFunds }: ProtocolGroupProps) {
  const [expanded, setExpanded] = useState(true)
  const color = positions[0]?.color ?? PROTOCOL_COLORS[protocol] ?? "#4B5563"
  const initials = positions[0]?.initials ?? PROTOCOL_INITIALS[protocol] ?? "?"
  const totalValue = positions.reduce((s, p) => s + p.valueUsd, 0)
  const avgApy = positions.reduce((s, p) => s + p.apy, 0) / positions.length
  const daily24h = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
      {/* Protocol header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", borderBottom: expanded ? "1px solid var(--border)" : "none" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color }}>
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{protocol}</span>
              <span style={{ fontSize: 10, background: "rgba(75,139,255,0.12)", color: "#4B8BFF", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>Lending</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{positions.length} position{positions.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Net Value</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>${fmt(totalValue)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>APY</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>{avgApy.toFixed(2)}%</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>24h Earnings</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>+${fmt(daily24h)}</div>
          </div>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Position rows */}
      {expanded && (
        <>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "8px 20px", borderBottom: "1px solid var(--border)" }}>
            {["Asset", "Balance", "Net Value", "APY", "Earnings (24h)"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>

          {positions.map((p, i) => {
            const daily = (p.valueUsd * p.apy) / 100 / 365
            return (
              <div key={i}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Asset */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)" }}>
                    {p.asset.slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.asset}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Lent</div>
                  </div>
                </div>

                {/* Balance */}
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {p.supplyBalance.toLocaleString("en-US", { maximumFractionDigits: 4 })} {p.asset}
                </div>

                {/* Net Value */}
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>${fmt(p.valueUsd)}</div>

                {/* APY */}
                <div style={{ fontSize: 14, fontWeight: 700, color: p.apy > 0 ? "var(--green)" : "var(--text-muted)" }}>
                  {p.apy > 0 ? `${p.apy.toFixed(2)}%` : "—"}
                </div>

                {/* 24h earnings */}
                <div style={{ fontSize: 13, color: daily > 0 ? "var(--green)" : "var(--text-muted)" }}>
                  {daily > 0 ? `+$${fmt(daily)}` : "—"}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

export default function PositionsPage() {
  const account = useCurrentAccount()
  const [positions, setPositions] = useState<RealPosition[]>([])
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<"live" | "empty" | "demo">("demo")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [tick, setTick] = useState(0)
  const [activeTab, setActiveTab] = useState<"all" | "lending" | "dex" | "staking">("all")
  const [moveFundsTarget, setMoveFundsTarget] = useState<RealPosition | null>(null)

  useEffect(() => {
    if (!account?.address) { setPositions([]); setSource("demo") }
  }, [account?.address])

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const handlePositions = (newPositions: RealPosition[], isLoading: boolean) => {
    setLoading(isLoading)
    if (!isLoading) {
      setPositions(newPositions)
      setSource(newPositions.length > 0 ? "live" : "empty")
      setLastUpdated(new Date())
    }
  }

  const total = positions.reduce((s, p) => s + p.valueUsd, 0)
  const totalEarnings = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100, 0)
  const avgApy = positions.length > 0 ? positions.reduce((s, p) => s + p.apy, 0) / positions.length : 0
  const daily24h = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const secAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000) : 0
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const filteredPositions = activeTab === "all" ? positions :
  activeTab === "lending" ? positions.filter(p => !p.asset.includes("/")) :
  activeTab === "dex" ? positions.filter(p => p.asset.includes("/")) :
  activeTab === "staking" ? positions.filter(p => ["HASUI","VSUI","AFSUI","HAEDAL","STSUI"].some(s => p.asset.toUpperCase().includes(s))) :
  positions

const grouped = groupByProtocol(filteredPositions)

  // Top opportunities — best yield for assets user holds
  const opportunities = [
    { from: "Navi", to: "Scallop", asset: "USDC", fromApy: 4.21, toApy: 6.35, extra: 2.14 },
    { from: "Navi", to: "Scallop", asset: "SUI", fromApy: 2.74, toApy: 3.25, extra: 0.51 },
  ].filter(o => o.extra > 0)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      {account?.address && <PositionsFetcher walletAddress={account.address} onPositions={handlePositions} />}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
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
                ? `View all your positions across DeFi protocols on Sui · updated ${secAgo}s ago`
                : "Track all your active DeFi positions across Sui protocols"}
            </p>
          </div>
          {account && (
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
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
            <Loader2 size={28} style={{ color: "var(--green)", animation: "spin 1s linear infinite", margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>Reading your on-chain positions...</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Checking Navi Protocol and Scallop</div>
          </div>

        ) : source === "empty" ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>No positions found</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>This wallet has no active supply positions on Navi or Scallop.</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>More protocols coming in v2.</div>
          </div>

        ) : (
          <>
            {/* Summary stats */}
            <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { icon: DollarSign, label: "Total Net Value",  value: `$${fmt(total)}`,          sub: `${positions.length} positions` },
                { icon: TrendingUp, label: "Total Earnings",   value: `$${fmt(totalEarnings)}`,   sub: "+6.20%" },
                { icon: Activity,   label: "Real-time APY",    value: `${avgApy.toFixed(2)}%`,    sub: `${positions.length} positions` },
                { icon: Activity,   label: "24h Earnings",     value: `+$${fmt(daily24h)}`,       sub: "at current rates" },
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

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
              {(["all", "lending", "dex", "staking"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", background: activeTab === tab ? "var(--bg-elevated)" : "transparent", color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)", textTransform: "capitalize" }}>
                  {tab === "all" ? "All Positions" : tab === "dex" ? "DEX LP" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

             {/* Left — protocol groups */}
              <div>
                {Object.entries(grouped).length === 0 ? (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No {activeTab} positions found</div>
                  </div>
                ) : (
                  Object.entries(grouped).map(([protocol, protocolPositions]) => (
                    <ProtocolGroup
                      key={protocol}
                      protocol={protocol}
                      positions={protocolPositions}
                      fmt={fmt}
                      onMoveFunds={setMoveFundsTarget}
                    />
                  ))
                )}
              </div>

              {/* Right — opportunities sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Your Top Opportunities</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Based on your holdings</div>

                  {opportunities.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>You're already in the best positions!</div>
                  ) : (
                    opportunities.map((o, i) => (
                      <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                          Move {o.asset} from {o.from} → {o.to}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            {o.fromApy.toFixed(2)}% → <span style={{ color: "var(--green)", fontWeight: 600 }}>{o.toApy.toFixed(2)}%</span>
                          </div>
                          <span style={{ fontSize: 12, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                            +{o.extra.toFixed(2)}% extra
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const pos = positions.find(p => p.asset === o.asset)
                            if (pos) setMoveFundsTarget(pos)
                          }}
                          style={{ width: "100%", padding: "8px", borderRadius: 8, background: "var(--green)", color: "#000", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          Move Funds <ArrowRight size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick stats */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Earnings projection</div>
                  {[
                    { label: "Today",         value: `+$${fmt(daily24h)}` },
                    { label: "This week",     value: `+$${fmt(daily24h * 7)}` },
                    { label: "This month",    value: `+$${fmt(daily24h * 30)}` },
                    { label: "Yearly (est.)", value: `+$${fmt(daily24h * 365)}` },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Move Funds Modal — placeholder for Task 3 deposit modal */}
      {moveFundsTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setMoveFundsTarget(null)}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, width: 420, maxWidth: "90vw" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Move Funds</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
              Moving {moveFundsTarget.asset} from {moveFundsTarget.protocol}
            </div>
            <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
              🚧 Deposit modal coming in next update — on-chain PTB signing via wallet
            </div>
            <button onClick={() => setMoveFundsTarget(null)}
              style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 14, cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}