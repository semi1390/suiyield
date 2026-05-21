"use client"
import { useEffect, useState, useCallback } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import YieldTable from "@/components/YieldTable"
import PositionsPanel from "@/components/PositionsPanel"
import { AlertsFeed, AlertsPromo } from "@/components/AlertsFeed"
import { SEED_ALERTS, SEED_LENDING, SEED_DEX, SEED_STAKING, SEED_CEX } from "@/lib/seed-data"
import type { RealPosition } from "@/lib/positions"
import PositionsFetcher from "@/components/PositionsFetcher"
import { RefreshCw, Shield, Zap, BarChart3 } from "lucide-react"
import type { YieldEntry } from "@/types"
import type { LiveRate } from "@/app/api/live-rates/route"
import AiAdvisor from "@/components/AiAdvisor"

const FEATURES = [
  { icon: RefreshCw, label: "Real-time data",    desc: "Updated every 5 minutes from DeFiLlama on-chain data" },
  { icon: Shield,    label: "Non-custodial",      desc: "You keep control. We never hold your funds." },
  { icon: Zap,       label: "One-click actions",  desc: "Deposit or add liquidity with a single click." },
  { icon: BarChart3, label: "Best yield, always", desc: "We track every Sui protocol to find the best rates." },
]

function mergeLiveRates(yields: YieldEntry[], liveRates: LiveRate[]): YieldEntry[] {
  if (!liveRates.length) return yields
  const liveMap = new Map<string, LiveRate>()
  for (const r of liveRates) {
    liveMap.set(`${r.protocol}:${r.symbol.toUpperCase()}`, r)
    liveMap.set(`${r.protocol}:${r.pool.toUpperCase()}`, r)
  }
  return yields.map(y => {
    const protocolLower = y.protocol.toLowerCase()
    const assetUpper = y.asset.toUpperCase()
    const key1 = protocolLower.includes("navi")    ? `navi:${assetUpper}`    : null
    const key2 = protocolLower.includes("scallop") ? `scallop:${assetUpper}` : null
    const key3 = protocolLower.includes("navi")    ? `navi:${y.asset}`       : null
    const key4 = protocolLower.includes("scallop") ? `scallop:${y.asset}`    : null
    const live = (key1 && liveMap.get(key1)) || (key2 && liveMap.get(key2)) ||
                 (key3 && liveMap.get(key3)) || (key4 && liveMap.get(key4)) || null
    if (!live) return y
    const totalApy = live.apyBase + live.apyReward
    if (totalApy === 0) return y
    return { ...y, apy: totalApy, tvl: live.tvlUsd > 0 ? live.tvlUsd : y.tvl, isLive: true, source: live.source, apyBase: live.apyBase, apyReward: live.apyReward }
  })
}

export default function DashboardPage() {
  const account = useCurrentAccount()
  const [lending, setLending]   = useState<YieldEntry[]>(SEED_LENDING)
  const [dex, setDex]           = useState<YieldEntry[]>(SEED_DEX)
  const [staking, setStaking]   = useState<YieldEntry[]>(SEED_STAKING)
  const [cex, setCex]           = useState<YieldEntry[]>(SEED_CEX)
  const [positions, setPositions]             = useState<RealPosition[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsSource, setPositionsSource]   = useState<"live" | "empty" | "demo">("demo")
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [walletTokens, setWalletTokens] = useState<any[]>([])

  const fetchYields = useCallback(async () => {
    try {
      const [yieldsRes, liveRes] = await Promise.allSettled([
        fetch("/api/yields").then(r => r.json()),
        fetch("/api/live-rates").then(r => r.json()),
      ])
      const yieldsData = yieldsRes.status === "fulfilled" ? yieldsRes.value : null
      const liveData   = liveRes.status  === "fulfilled" ? liveRes.value   : null
      const liveRates: LiveRate[] = liveData?.data ?? []
      if (yieldsData?.grouped) {
        const rawLending = yieldsData.grouped.lending?.length ? yieldsData.grouped.lending : SEED_LENDING
        const rawDex     = yieldsData.grouped.dex?.length     ? yieldsData.grouped.dex     : SEED_DEX
        const rawStaking = yieldsData.grouped.staking?.length ? yieldsData.grouped.staking : SEED_STAKING
        const rawCex     = yieldsData.grouped.cex?.length     ? yieldsData.grouped.cex     : SEED_CEX
        setLending(mergeLiveRates(rawLending, liveRates))
        setDex(rawDex)
        setStaking(mergeLiveRates(rawStaking, liveRates))
        setCex(rawCex)
      }
      setLastUpdated(Date.now())
    } catch (err) {
      console.error("Yield fetch failed:", err)
    }
  }, [])

  useEffect(() => {
    fetchYields()
    const interval = setInterval(fetchYields, 300000)
    return () => clearInterval(interval)
  }, [fetchYields])

  useEffect(() => {
    if (!account?.address) { setWalletTokens([]); return }
    fetch(`/api/wallet-tokens?address=${account.address}`)
      .then(r => r.json())
      .then(data => { if (data.tokens) setWalletTokens(data.tokens) })
      .catch(() => {})
  }, [account?.address])

  const handlePositions = (newPositions: RealPosition[], isLoading: boolean) => {
    setPositionsLoading(isLoading)
    if (!isLoading) {
      setPositions(newPositions)
      setPositionsSource(newPositions.length > 0 ? "live" : "empty")
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar lastUpdated={lastUpdated} />
      {account?.address && (
        <PositionsFetcher walletAddress={account.address} onPositions={handlePositions} />
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px" }}>

        {/* Hero */}
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
            <a href="#table" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green)", color: "#000", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              View opportunities →
            </a>
          </div>

          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <AiAdvisor
              positions={positions}
              walletTokens={walletTokens}
              connected={!!account}
              positionsLoading={positionsLoading}
            />
          </div>
        </div>

        {/* Main grid */}
        <div id="table" className="dashboard-main" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            <YieldTable lending={lending} dex={dex} staking={staking} cex={cex} lastUpdated={lastUpdated} />
           <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }}>
              {FEATURES.map((f, i) => (
                <div key={i} className={i < 2 ? "features-grid-item-top" : ""} style={{ padding: "20px 18px", borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
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
            <PositionsPanel
              positions={positions}
              connected={!!account}
              loading={positionsLoading}
              source={positionsSource}
            />
            <AlertsFeed alerts={SEED_ALERTS} />
            <AlertsPromo />
          </div>
        </div>
      </div>

      <style suppressHydrationWarning>{`
  @media (max-width: 768px) {
    .dashboard-hero { grid-template-columns: 1fr !important; }
    .hero-title { font-size: 32px !important; }
    .dashboard-main { grid-template-columns: 1fr !important; }
    .dashboard-sidebar { display: none !important; }
    .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .features-grid-item-top { border-bottom: 1px solid var(--border) !important; }
  }
  @media (max-width: 390px) {
    .features-grid { grid-template-columns: 1fr !important; }
    .hero-title { font-size: 28px !important; }
  }
`}</style>
    </div>
  )
}