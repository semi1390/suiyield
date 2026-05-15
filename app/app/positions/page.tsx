"use client"
import { useState, useEffect, useCallback } from "react"
import PositionsFetcher from "@/components/PositionsFetcher"
import { useCurrentAccount } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import { Wallet, TrendingUp, DollarSign, Activity, Loader2, RefreshCw, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import type { RealPosition } from "@/lib/positions"

const PROTOCOL_COLORS: Record<string, string> = {
  "Navi Protocol": "#1A4FE0",
  "Scallop": "#8B5CF6",
  "Suilend": "#EC4899",
  "Cetus": "#06B6D4",
  "Haedal": "#3A9FF5",
}

const PROTOCOL_INITIALS: Record<string, string> = {
  "Navi Protocol": "N",
  "Scallop": "Sc",
  "Suilend": "Sl",
  "Cetus": "C",
  "Haedal": "H",
}

const PROTOCOL_TYPE: Record<string, string> = {
  "Navi Protocol": "Lending",
  "Scallop": "Lending",
  "Suilend": "Lending",
  "Cetus": "DEX LP",
  "Haedal": "Staking",
}

interface LiveRate {
  protocol: string
  symbol: string
  apyBase: number
  apyReward: number
  source: string
}

interface Opportunity {
  asset: string
  fromProtocol: string
  toProtocol: string
  fromApy: number
  toApy: number
  extra: number
}

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
  const isCetus = protocol === "Cetus"
  const typeLabel = PROTOCOL_TYPE[protocol] ?? "Lending"

  const totalValue = positions.reduce((s, p) => s + p.valueUsd, 0)
  const avgApy = isCetus ? 0 : positions.reduce((s, p) => s + p.apy, 0) / positions.length
  const daily24h = isCetus ? 0 : positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)

  const cetusFeesUsd = isCetus
    ? positions.reduce((s, p) => {
        const cp = p as any
        return s + (cp.feeA ?? 0) * (cp.priceA ?? 0) + (cp.feeB ?? 0) * (cp.priceB ?? 0)
      }, 0)
    : 0

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer", borderBottom: expanded ? "1px solid var(--border)" : "none", flexWrap: "wrap", gap: 8 }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{protocol}</span>
              <span style={{ fontSize: 9, background: "rgba(75,139,255,0.12)", color: "#4B8BFF", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>{typeLabel}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{positions.length} position{positions.length > 1 ? "s" : ""}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>Net Value</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>${fmt(totalValue)}</div>
          </div>
          {!isCetus && (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>APY</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>{avgApy.toFixed(2)}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>24h</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>+${fmt(daily24h)}</div>
              </div>
            </>
          )}
          {isCetus && (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>Yield</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#06B6D4" }}>Fee-based</div>
              </div>
              {cetusFeesUsd > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>Unclaimed</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>${fmt(cetusFeesUsd)}</div>
                </div>
              )}
            </>
          )}
          {expanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
          {isCetus ? (
            <div style={{ minWidth: 340 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.7fr 0.7fr", padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                {["Pool", "Token A", "Token B", "Value", "Status"].map((h, i) => (
                  <div key={i} style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
              {positions.map((p, i) => {
                const cp = p as any
                return (
                  <div key={i}
                    style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.7fr 0.7fr", padding: "12px 16px", borderTop: i > 0 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#06B6D422", border: "1px solid #06B6D444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#06B6D4", flexShrink: 0 }}>C</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cp.name ?? p.asset}</div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{p.asset}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{cp.amountA?.toFixed(3) ?? "—"}</div>
                      <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{cp.symbolA ?? ""}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{cp.amountB?.toFixed(3) ?? "—"}</div>
                      <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{cp.symbolB ?? ""}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                        {cp.valueUsd > 0 ? `$${cp.valueUsd.toFixed(2)}` : "—"}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text-muted)" }}>USD</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: cp.inRange ? "var(--green)" : "#EF4444" }}>
                      {cp.inRange ? "In range" : "Out"}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ minWidth: 340 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.8fr 0.6fr 0.6fr", padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                {["Asset", "Balance", "Value", "APY", "24h"].map((h, i) => (
                  <div key={i} style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
                ))}
              </div>
              {positions.map((p, i) => {
                const daily = (p.valueUsd * p.apy) / 100 / 365
                return (
                  <div key={i}
                    style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.8fr 0.6fr 0.6fr", padding: "12px 16px", borderTop: i > 0 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>
                        {p.asset.slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{p.asset}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {p.protocol === "Haedal" ? "Staking" : "Lent"}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {p.supplyBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>${fmt(p.valueUsd)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: p.apy > 0 ? "var(--green)" : "var(--text-muted)" }}>
                      {p.apy > 0 ? `${p.apy.toFixed(2)}%` : "—"}
                    </div>
                    <div style={{ fontSize: 12, color: daily > 0 ? "var(--green)" : "var(--text-muted)" }}>
                      {daily > 0 ? `+$${fmt(daily)}` : "—"}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
  const [activeTab, setActiveTab] = useState<"all" | "lending" | "dex" | "staking">("all")
  const [moveFundsTarget, setMoveFundsTarget] = useState<RealPosition | null>(null)
  const [liveRates, setLiveRates] = useState<LiveRate[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!account?.address) { setPositions([]); setSource("demo") }
  }, [account?.address])

  useEffect(() => {
    fetch("/api/live-rates")
      .then(r => r.json())
      .then(data => { if (data.data?.length) setLiveRates(data.data) })
      .catch(() => {})
  }, [])

  const handleRefresh = useCallback(() => {
    if (!account?.address) return
    // Clear sessionStorage cache so PositionsFetcher re-fetches
    try {
      sessionStorage.removeItem(`suiyield_positions_${account.address}`)
    } catch {}
    setPositions([])
    setSource("demo")
    setRefreshKey(k => k + 1)
  }, [account?.address])

  const handlePositions = (newPositions: RealPosition[], isLoading: boolean) => {
    setLoading(isLoading)
    if (!isLoading) {
      setPositions(newPositions)
      setSource(newPositions.length > 0 ? "live" : "empty")
      setLastUpdated(new Date())
    }
  }

  const lendingPositions = positions.filter(p => p.protocol !== "Cetus")
  const cetusPositions = positions.filter(p => p.protocol === "Cetus")

  const total = positions.reduce((s, p) => s + p.valueUsd, 0)
  const totalEarnings = lendingPositions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100, 0)
  const avgApy = lendingPositions.length > 0
    ? lendingPositions.reduce((s, p) => s + p.apy, 0) / lendingPositions.length : 0
  const daily24h = lendingPositions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const cetusUnclaimedFees = cetusPositions.reduce((s, p) => {
    const cp = p as any
    return s + (cp.feeA ?? 0) * (cp.priceA ?? 0) + (cp.feeB ?? 0) * (cp.priceB ?? 0)
  }, 0)

  const secAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000) : 0
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const protocolCount = new Set(positions.map(p => p.protocol)).size

  const filteredPositions = activeTab === "all" ? positions :
    activeTab === "lending" ? positions.filter(p => p.protocol !== "Cetus" && p.protocol !== "Haedal") :
    activeTab === "dex" ? positions.filter(p => p.protocol === "Cetus") :
    positions.filter(p => p.protocol === "Haedal" || ["HASUI","VSUI","AFSUI","HAEDAL","STSUI","HAWAL"].some(s => p.asset.toUpperCase().includes(s)))

  const grouped = groupByProtocol(filteredPositions)

  const opportunities: Opportunity[] = []
  for (const pos of lendingPositions.filter(p => p.protocol !== "Haedal")) {
    const assetUpper = pos.asset.toUpperCase()
    const currentProtocol = pos.protocol.toLowerCase().includes("navi") ? "navi" : "scallop"
    const bestOther = liveRates
      .filter(r => r.symbol?.toUpperCase() === assetUpper && r.protocol !== currentProtocol)
      .sort((a, b) => (b.apyBase + b.apyReward) - (a.apyBase + a.apyReward))[0]
    if (!bestOther) continue
    const extra = (bestOther.apyBase + bestOther.apyReward) - pos.apy
    if (extra < 0.5) continue
    opportunities.push({
      asset: pos.asset,
      fromProtocol: pos.protocol,
      toProtocol: bestOther.protocol === "navi" ? "Navi Protocol" : "Scallop",
      fromApy: pos.apy,
      toApy: bestOther.apyBase + bestOther.apyReward,
      extra,
    })
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      {account?.address && (
        <PositionsFetcher
          key={refreshKey}
          walletAddress={account.address}
          onPositions={handlePositions}
        />
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>My Positions</h1>
              {source === "live" && (
                <span style={{ fontSize: 10, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>LIVE</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {source === "live"
                ? `Updated ${secAgo}s ago · Navi · Scallop · Cetus · Haedal`
                : "Track your DeFi positions across Sui"}
            </p>
          </div>
          {account && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "var(--text-secondary)", cursor: loading ? "not-allowed" : "pointer", flexShrink: 0, opacity: loading ? 0.6 : 1 }}>
              <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>

        {!account ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Wallet size={22} style={{ color: "var(--text-muted)" }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Connect your wallet</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 320, margin: "0 auto" }}>
              Connect your Sui wallet to see your real on-chain positions on Navi, Scallop, Cetus and Haedal.
            </div>
          </div>

        ) : loading ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 20px", textAlign: "center" }}>
            <Loader2 size={26} style={{ color: "var(--green)", animation: "spin 1s linear infinite", margin: "0 auto 14px", display: "block" }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>Reading your on-chain positions...</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Checking Navi · Scallop · Cetus · Haedal</div>
          </div>

        ) : source === "empty" ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>No positions found</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>No active positions on Navi, Scallop, Cetus or Haedal.</div>
            <button onClick={handleRefresh}
              style={{ padding: "8px 20px", borderRadius: 10, background: "var(--green)", color: "#000", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
              Try again
            </button>
          </div>

        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }} className="stats-grid">
              {[
                { icon: DollarSign, label: "Net Value",    value: `$${fmt(total)}`,         sub: `${positions.length} positions · ${protocolCount} protocols` },
                { icon: TrendingUp, label: "Yearly Est.",  value: `$${fmt(totalEarnings)}`, sub: "lending only" },
                { icon: Activity,   label: "Avg APY",      value: `${avgApy.toFixed(2)}%`,  sub: "lending positions" },
                { icon: Activity,   label: "24h Earnings", value: `+$${fmt(daily24h)}`,     sub: "lending only" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <s.icon size={13} style={{ color: "var(--green)" }} />
                    <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, overflowX: "auto" }}>
              {(["all", "lending", "dex", "staking"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: activeTab === tab ? "var(--bg-elevated)" : "transparent", color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {tab === "all" ? "All" : tab === "dex" ? "DEX LP" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} className="positions-main">
              <div>
                {Object.entries(grouped).length === 0 ? (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No {activeTab} positions found</div>
                  </div>
                ) : (
                  Object.entries(grouped).map(([protocol, protocolPositions]) => (
                    <ProtocolGroup key={protocol} protocol={protocol} positions={protocolPositions} fmt={fmt} onMoveFunds={setMoveFundsTarget} />
                  ))
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Top Opportunities</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>Based on your holdings + live rates</div>
                  {opportunities.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                      {liveRates.length === 0 ? "Loading rates..." : "You're in the best positions!"}
                    </div>
                  ) : (
                    opportunities.slice(0, 3).map((o, i) => (
                      <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{o.asset} · {o.fromProtocol} → {o.toProtocol}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {o.fromApy.toFixed(2)}% → <span style={{ color: "var(--green)", fontWeight: 600 }}>{o.toApy.toFixed(2)}%</span>
                          </div>
                          <span style={{ fontSize: 11, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 6, padding: "2px 6px", fontWeight: 600 }}>+{o.extra.toFixed(2)}%</span>
                        </div>
                        <button
                          onClick={() => { const pos = positions.find(p => p.asset === o.asset); if (pos) setMoveFundsTarget(pos) }}
                          style={{ width: "100%", padding: "7px", borderRadius: 8, background: "var(--green)", color: "#000", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          Move Funds <ArrowRight size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Earnings Projection</div>
                  {[
                    { label: "Today",      value: `+$${fmt(daily24h)}` },
                    { label: "This week",  value: `+$${fmt(daily24h * 7)}` },
                    { label: "This month", value: `+$${fmt(daily24h * 30)}` },
                    { label: "Yearly",     value: `+$${fmt(daily24h * 365)}` },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--green)" }}>{r.value}</span>
                    </div>
                  ))}
                  {cetusUnclaimedFees > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, color: "#06B6D4" }}>Cetus unclaimed fees</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#06B6D4" }}>${fmt(cetusUnclaimedFees)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {moveFundsTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setMoveFundsTarget(null)}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Move Funds</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Moving {moveFundsTarget.asset} from {moveFundsTarget.protocol}</div>
            <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
              🚧 Cross-protocol moves coming soon
            </div>
            <button onClick={() => setMoveFundsTarget(null)}
              style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .positions-main { grid-template-columns: 1fr 320px !important; }
        }
      `}</style>
    </div>
  )
}