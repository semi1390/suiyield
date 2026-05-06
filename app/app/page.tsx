"use client"
import { useEffect, useState, useCallback } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import YieldTable from "@/components/YieldTable"
import PositionsPanel from "@/components/PositionsPanel"
import { AlertsFeed, EarnMoreCard, AlertsPromo } from "@/components/AlertsFeed"
import { SEED_ALERTS, SEED_LENDING, SEED_DEX, SEED_STAKING, SEED_CEX } from "@/lib/seed-data"
import type { RealPosition } from "@/lib/positions"
import PositionsFetcher from "@/components/PositionsFetcher"
import { RefreshCw, Shield, Zap, TrendingUp, BarChart3 } from "lucide-react"
import type { YieldEntry } from "@/types"

const FEATURES = [
  { icon: RefreshCw, label: "Real-time data", desc: "Updated every 5 minutes from DeFiLlama on-chain data" },
  { icon: Shield, label: "Non-custodial", desc: "You keep control. We never hold your funds." },
  { icon: Zap, label: "One-click actions", desc: "Deposit or add liquidity with a single click." },
  { icon: BarChart3, label: "Best yield, always", desc: "We track every Sui protocol to find the best rates." },
]

export default function DashboardPage() {
  const account = useCurrentAccount()
  const [lending, setLending] = useState<YieldEntry[]>(SEED_LENDING)
  const [dex, setDex] = useState<YieldEntry[]>(SEED_DEX)
  const [staking, setStaking] = useState<YieldEntry[]>(SEED_STAKING)
  const [cex, setCex] = useState<YieldEntry[]>(SEED_CEX)
  const [allYields, setAllYields] = useState<YieldEntry[]>([...SEED_LENDING, ...SEED_DEX, ...SEED_STAKING])
  const [positions, setPositions] = useState<RealPosition[]>([])
  const [dailyEarnings, setDailyEarnings] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [loading, setLoading] = useState(false)
  const [secAgo, setSecAgo] = useState(0)

  const fetchYields = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/yields")
      const data = await res.json()
      if (data.grouped) {
        setLending(data.grouped.lending?.length ? data.grouped.lending : SEED_LENDING)
        setDex(data.grouped.dex?.length ? data.grouped.dex : SEED_DEX)
        setStaking(data.grouped.staking?.length ? data.grouped.staking : SEED_STAKING)
        setCex(data.grouped.cex?.length ? data.grouped.cex : SEED_CEX)
        setAllYields(data.yields || [])
      }
      setLastUpdated(Date.now())
    } catch (err) {
      console.error("Yield fetch failed, using seed data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchYields()
    const interval = setInterval(fetchYields, 300000) // 5 min
    return () => clearInterval(interval)
  }, [fetchYields])

  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsSource, setPositionsSource] = useState<"live"|"empty"|"demo">("demo")

  const handlePositions = (newPositions: RealPosition[], loading: boolean) => {
    setPositionsLoading(loading)
    if (!loading) {
      setPositions(newPositions)
      setPositionsSource(newPositions.length > 0 ? "live" : "empty")
      const daily = newPositions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
      setDailyEarnings(daily)
    }
  }

  useEffect(() => {
    const t = setInterval(() => setSecAgo(Math.floor((Date.now() - lastUpdated) / 1000)), 1000)
    return () => clearInterval(t)
  }, [lastUpdated])

  const bestLending = [...lending].sort((a, b) => b.apy - a.apy)[0]
  const userPos = positions[0] || null
  const extraApy = bestLending && userPos ? Math.max(0, bestLending.apy - userPos.apy) : 0

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar lastUpdated={lastUpdated} />
      {account?.address && <PositionsFetcher walletAddress={account.address} onPositions={handlePositions} />}

      <div className="page-padding" style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px" }}>

        {/* Hero + Earn More */}
        <div className="dashboard-hero" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, marginBottom: 20 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 20, padding: "4px 12px", marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 500 }}>Live on Sui mainnet</span>
            </div>
            <h1 className="hero-title" style={{ fontSize: 44, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: 16 }}>
              Find the best yield<br />
              across{" "}<span style={{ color: "#4B8BFF" }}>Sui</span>{" — "}
              <span style={{ color: "var(--green)" }}>instantly.</span>
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
              Compare lending, DEX pools, staking and CEX yields in one place and put your money where it earns more.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="#table" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--green)", color: "#000", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                View opportunities →
              </a>

            </div>
          </div>

          {/* Earn More card */}
          <div className="earn-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>You could earn more</span>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--text-muted)", cursor: "help" }}>?</div>
            </div>
            {userPos ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>You're earning</div>
                    <div style={{ fontSize: 34, fontWeight: 700, color: "var(--text-secondary)" }}>{userPos.apy.toFixed(2)}%</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: userPos.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: userPos.color }}>{userPos.initials}</div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{userPos.asset} on {userPos.protocol}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 22, color: "var(--text-muted)" }}>›</div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Best available</div>
                    <div style={{ fontSize: 34, fontWeight: 700, color: "var(--green)" }}>{bestLending?.apy.toFixed(2)}%</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: (bestLending?.color || "#000") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: bestLending?.color }}>{bestLending?.initials?.charAt(0)}</div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>on {bestLending?.protocol}</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid var(--green-border)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>That's up to</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>+{extraApy.toFixed(2)}% extra APY</span>
                </div>
                <a href={bestLending?.depositUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 10, background: "var(--green)", color: "#000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  Move funds →
                </a>
              </>
            ) : (
              <>
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>Connect wallet to see your earnings</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Best available right now:</div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: "var(--green)", margin: "8px 0" }}>{bestLending?.apy.toFixed(2)}%</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>on {bestLending?.protocol} ({bestLending?.asset})</div>
                </div>
                <a href={bestLending?.depositUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 10, background: "var(--green)", color: "#000", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  Start earning →
                </a>
              </>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div id="table" className="dashboard-main" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <YieldTable lending={lending} dex={dex} staking={staking} cex={cex} />
            <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ padding: "20px 18px", borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <f.icon size={15} style={{ color: "var(--green)" }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PositionsPanel positions={positions} connected={!!account} loading={positionsLoading} source={positionsSource} />
            <AlertsFeed alerts={SEED_ALERTS} />
            <AlertsPromo />
          </div>
        </div>
      </div>
    </div>
  )
}