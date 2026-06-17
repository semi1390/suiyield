"use client"
import { useState, useEffect, useCallback } from "react"
import PositionsFetcher from "@/components/PositionsFetcher"
import { useCurrentAccount } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import { Wallet, TrendingUp, DollarSign, Activity, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import type { RealPosition } from "@/lib/positions"

const PROTOCOL_COLORS: Record<string, string> = {
  "Navi Protocol": "#1A4FE0", "Scallop": "#8B5CF6", "Suilend": "#EC4899", "Cetus": "#06B6D4", "Haedal": "#3A9FF5",
}
const PROTOCOL_INITIALS: Record<string, string> = {
  "Navi Protocol": "N", "Scallop": "Sc", "Suilend": "Sl", "Cetus": "C", "Haedal": "H",
}
const PROTOCOL_TYPE: Record<string, string> = {
  "Navi Protocol": "Lending", "Scallop": "Lending", "Suilend": "Lending", "Cetus": "DEX LP", "Haedal": "Staking",
}
const PROTOCOL_URLS: Record<string, string> = {
  "Navi Protocol": "https://app.naviprotocol.io/market",
  "Scallop": "https://app.scallop.io/lending",
  "Cetus": "https://app.cetus.zone/pools",
  "Haedal": "https://www.haedal.xyz/stake",
}

interface LiveRate { protocol: string; symbol: string; apyBase: number; apyReward: number; source: string }
interface Opportunity { asset: string; fromProtocol: string; toProtocol: string; fromApy: number; toApy: number; extra: number; valueUsd: number }

function groupByProtocol(positions: RealPosition[]): Record<string, RealPosition[]> {
  const groups: Record<string, RealPosition[]> = {}
  for (const p of positions) {
    if (!groups[p.protocol]) groups[p.protocol] = []
    groups[p.protocol].push(p)
  }
  return groups
}

function ProtocolGroup({ protocol, positions, fmt }: { protocol: string; positions: RealPosition[]; fmt: (n: number) => string }) {
  const [expanded, setExpanded] = useState(true)
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])

  const color = positions[0]?.color ?? PROTOCOL_COLORS[protocol] ?? "#4B5563"
  const initials = positions[0]?.initials ?? PROTOCOL_INITIALS[protocol] ?? "?"
  const isCetus = protocol === "Cetus"
  const typeLabel = PROTOCOL_TYPE[protocol] ?? "Lending"
  const totalValue = positions.reduce((s, p) => s + p.valueUsd, 0)
  const avgApy = isCetus ? 0 : positions.reduce((s, p) => s + p.apy, 0) / positions.length
  const daily24h = isCetus ? 0 : positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const cetusFeesUsd = isCetus ? positions.reduce((s, p) => {
    const cp = p as any
    return s + (cp.feeA ?? 0) * (cp.priceA ?? 0) + (cp.feeB ?? 0) * (cp.priceB ?? 0)
  }, 0) : 0

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", marginBottom: 12, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition: "all 0.4s ease" }}>
      {/* Header */}
      <div onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", cursor: "pointer", borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none", flexWrap: "wrap", gap: 8, transition: "background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: color + "20", border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{protocol}</span>
              <span style={{ fontSize: 9, background: "rgba(75,139,255,0.12)", color: "#4B8BFF", borderRadius: 4, padding: "2px 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{typeLabel}</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{positions.length} position{positions.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Value</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>${fmt(totalValue)}</div>
          </div>
          {!isCetus && <>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>APY</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#00D4AA" }}>{avgApy.toFixed(2)}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>24h</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#00D4AA" }}>+${fmt(daily24h)}</div>
            </div>
          </>}
          {isCetus && <>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Yield</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#06B6D4" }}>Fee-based</div>
            </div>
            {cetusFeesUsd > 0 && <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Unclaimed</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#00D4AA" }}>${fmt(cetusFeesUsd)}</div>
            </div>}
          </>}
          {expanded ? <ChevronUp size={15} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={15} color="rgba(255,255,255,0.3)" />}
        </div>
      </div>

      {/* Table */}
      {expanded && (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
          {isCetus ? (
          <table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse" }} className="positions-table">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Pool", "Token A", "Token B", "Value", "Status"].map((h, i) => (
                    <th key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 16px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => {
                  const cp = p as any
                  return (
                   <tr key={i} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
  <td data-label="Pool" style={{ padding: "12px 16px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#06B6D420", border: "1px solid #06B6D440", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#06B6D4", flexShrink: 0 }}>C</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{cp.name ?? p.asset}</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{p.asset}</div>
      </div>
    </div>
  </td>
  <td data-label="Token A" style={{ padding: "12px 16px" }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{cp.amountA?.toFixed(3) ?? "—"}</div>
    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{cp.symbolA ?? ""}</div>
  </td>
  <td data-label="Token B" style={{ padding: "12px 16px" }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{cp.amountB?.toFixed(3) ?? "—"}</div>
    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{cp.symbolB ?? ""}</div>
  </td>
  <td data-label="Value" style={{ padding: "12px 16px" }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{cp.valueUsd > 0 ? `$${cp.valueUsd.toFixed(2)}` : "—"}</div>
    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>USD</div>
  </td>
  <td data-label="Status" style={{ padding: "12px 16px" }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: cp.inRange ? "#00D4AA" : "#EF4444", background: cp.inRange ? "rgba(0,212,170,0.08)" : "rgba(239,68,68,0.08)", borderRadius: 6, padding: "3px 8px" }}>
      {cp.inRange ? "In range" : "Out"}
    </span>
  </td>
</tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse" }} className="positions-table">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Asset", "Balance", "Value", "APY", "24h"].map((h, i) => (
                    <th key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 16px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => {
                  const daily = (p.valueUsd * p.apy) / 100 / 365
                  return (
                    <tr key={i} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                            {p.asset.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{p.asset}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.protocol === "Haedal" ? "Staking" : "Lent"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        {p.supplyBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                        ${fmt(p.valueUsd)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: p.apy > 0 ? "#00D4AA" : "rgba(255,255,255,0.3)" }}>
                        {p.apy > 0 ? `${p.apy.toFixed(2)}%` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: daily > 0 ? "#00D4AA" : "rgba(255,255,255,0.3)" }}>
                        {daily > 0 ? `+$${fmt(daily)}` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
  const [liveRates, setLiveRates] = useState<LiveRate[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (!account?.address) { setPositions([]); setSource("demo") } }, [account?.address])
  useEffect(() => {
    fetch("/api/live-rates").then(r => r.json()).then(data => { if (data.data?.length) setLiveRates(data.data) }).catch(() => {})
  }, [])

  const handleRefresh = useCallback(() => {
    if (!account?.address) return
    try { sessionStorage.removeItem(`suiyield_positions_${account.address}`) } catch {}
    setPositions([]); setSource("demo"); setRefreshKey(k => k + 1)
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
  const avgApy = lendingPositions.length > 0 ? lendingPositions.reduce((s, p) => s + p.apy, 0) / lendingPositions.length : 0
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
    const relativeGain = (extra / pos.apy) * 100
    if (extra < 0.5 || relativeGain < 10) continue
    opportunities.push({
      asset: pos.asset, fromProtocol: pos.protocol,
      toProtocol: bestOther.protocol === "navi" ? "Navi Protocol" : "Scallop",
      fromApy: pos.apy, toApy: bestOther.apyBase + bestOther.apyReward, extra, valueUsd: pos.valueUsd,
    })
  }

  const Sidebar = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Opportunities */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Top Opportunities</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Based on your holdings + live rates</div>
        {opportunities.length === 0 ? (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "16px 0" }}>
            {liveRates.length === 0 ? "Loading rates..." : "You're in the best positions!"}
          </div>
        ) : opportunities.slice(0, 3).map((o, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>{o.asset} · {o.fromProtocol} → {o.toProtocol}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                {o.fromApy.toFixed(2)}% → <span style={{ color: "#00D4AA", fontWeight: 700 }}>{o.toApy.toFixed(2)}%</span>
              </div>
              <span style={{ fontSize: 11, background: "rgba(0,212,170,0.1)", color: "#00D4AA", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 6, padding: "2px 8px", fontWeight: 700, flexShrink: 0 }}>
                {Math.round((o.extra / o.fromApy) * 100)}% more yield
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#F5A623", fontWeight: 600, marginBottom: 12 }}>
              +${((o.valueUsd * o.extra) / 100).toFixed(2)}/year left on the table
            </div>
            <a href={o.toProtocol.toLowerCase().includes("navi") ? "https://app.naviprotocol.io/market" : "https://app.scallop.io/lending"}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "block", textAlign: "center", background: "#00D4AA", color: "#000", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Move Funds →
            </a>
          </div>
        ))}
      </div>

      {/* Earnings */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Earnings Projection</div>
        {[
          { label: "Today",      value: `+$${fmt(daily24h)}` },
          { label: "This week",  value: `+$${fmt(daily24h * 7)}` },
          { label: "This month", value: `+$${fmt(daily24h * 30)}` },
          { label: "Yearly",     value: `+$${fmt(daily24h * 365)}` },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#00D4AA" }}>{r.value}</span>
          </div>
        ))}
        {cetusUnclaimedFees > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 13, color: "#06B6D4" }}>Cetus unclaimed fees</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#06B6D4" }}>${fmt(cetusUnclaimedFees)}</span>
          </div>
        )}
      </div>

      {/* Quick deposit links */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Deposit to protocols</div>
        {Object.entries(PROTOCOL_URLS).map(([name, url], i) => (
          <a key={name} href={url} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", textDecoration: "none", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{name}</span>
            <span style={{ fontSize: 12, color: "#00D4AA" }}>Deposit ↗</span>
          </a>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A" }}>
      <Navbar />
      {account?.address && <PositionsFetcher key={refreshKey} walletAddress={account.address} onPositions={handlePositions} />}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>My Positions</h1>
              {source === "live" && (
                <span style={{ fontSize: 10, background: "rgba(0,212,170,0.1)", color: "#00D4AA", border: "1px solid rgba(0,212,170,0.25)", borderRadius: 20, padding: "3px 10px", fontWeight: 700, letterSpacing: "0.05em" }}>LIVE</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              {source === "live" ? `Updated ${secAgo}s ago · Navi · Scallop · Cetus · Haedal` : "Track your DeFi positions across Sui"}
            </p>
          </div>
          {account && (
            <button onClick={handleRefresh} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: loading ? "not-allowed" : "pointer", flexShrink: 0, opacity: loading ? 0.6 : 1 }}>
              <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>

        {/* States */}
        {!account ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "80px 24px", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Wallet size={26} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Connect your wallet</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
              Connect your Sui wallet to see your real on-chain positions across Navi, Scallop, Cetus and Haedal.
            </div>
          </div>

        ) : loading ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "80px 24px", textAlign: "center" }}>
            <Loader2 size={32} style={{ color: "#00D4AA", animation: "spin 1s linear infinite", margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Reading your on-chain positions...</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Checking Navi · Scallop · Cetus · Haedal</div>
          </div>

        ) : source === "empty" ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "80px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 10 }}>No positions found</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>No active positions on Navi, Scallop, Cetus or Haedal.</div>
            <button onClick={handleRefresh} style={{ padding: "10px 24px", borderRadius: 10, background: "#00D4AA", color: "#000", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
              Try again
            </button>
          </div>

        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }} className="stats-grid">
              {[
                { icon: DollarSign, label: "Net Value",    value: `$${fmt(total)}`,         sub: `${positions.length} positions · ${protocolCount} protocols` },
                { icon: TrendingUp, label: "Yearly Est.",  value: `$${fmt(totalEarnings)}`, sub: "lending only" },
                { icon: Activity,   label: "Avg APY",      value: `${avgApy.toFixed(2)}%`,  sub: "lending positions" },
                { icon: Activity,   label: "24h Earnings", value: `+$${fmt(daily24h)}`,     sub: "lending only" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: `all 0.5s ease ${i * 0.08}s` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <s.icon size={12} style={{ color: "#00D4AA" }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, overflowX: "auto" }}>
              {(["all", "lending", "dex", "staking"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent", color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.35)", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }}>
                  {tab === "all" ? "All" : tab === "dex" ? "DEX LP" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Desktop: sidebar on right. Mobile: positions first, sidebar below */}
            <div className="positions-layout" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>

              {/* Positions — always first */}
              <div className="positions-list">
                {Object.entries(grouped).length === 0 ? (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No {activeTab} positions found</div>
                  </div>
                ) : (
                  Object.entries(grouped).map(([protocol, protocolPositions]) => (
                    <ProtocolGroup key={protocol} protocol={protocol} positions={protocolPositions} fmt={fmt} />
                  ))
                )}
              </div>

              {/* Sidebar — below on mobile, right column on desktop */}
              <div className="positions-sidebar">
                {Sidebar}
              </div>
            </div>
          </>
        )}
      </div>

 <style suppressHydrationWarning>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (min-width: 900px) {
    .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
    .positions-layout { grid-template-columns: 1fr 320px !important; }
    .positions-list { grid-column: 1; grid-row: 1; }
    .positions-sidebar { grid-column: 2; grid-row: 1; }
  }
  @media (max-width: 899px) {
    .positions-list { order: 1; }
    .positions-sidebar { order: 2; }
  }
  @media (max-width: 600px) {
    .positions-table thead { display: none; }
    .positions-table tbody tr {
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.05);
      gap: 6px;
    }
    .positions-table tbody td {
      padding: 0 !important;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px !important;
    }
    .positions-table tbody td::before {
      content: attr(data-label);
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      flex-shrink: 0;
      margin-right: 8px;
    }
    .positions-table { min-width: unset !important; width: 100% !important; }
  }
`}</style>
    </div>
  )
}