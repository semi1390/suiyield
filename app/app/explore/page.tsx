"use client"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import type { YieldEntry } from "@/types"
import { Search, TrendingUp, Flame, Zap } from "lucide-react"
import { SEED_STAKING } from "@/lib/seed-data"

const ASSET_TABS = ["All", "USDC", "USDT", "SUI", "WBTC", "WETH", "DEEP", "WAL"]
const CATEGORY_TABS = ["All", "Lending", "DEX", "Staking"]

function fmtTvl(n: number) {
  if (n === 0) return "—"
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${(n / 1000).toFixed(0)}K`
}

function ProtocolAvatar({ y }: { y: YieldEntry }) {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: y.color + "22", border: `1px solid ${y.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: y.color, flexShrink: 0, overflow: "hidden" }}>
      {y.logo && !imgFailed
        ? <img src={y.logo} alt={y.protocol} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgFailed(true)} />
        : <span style={{ fontSize: 9, fontWeight: 700, color: y.color }}>{y.initials}</span>}
    </div>
  )
}

interface TrendCardProps {
  label: string
  icon: React.ReactNode
  iconColor: string
  pools: YieldEntry[]
  badge?: string
  badgeColor?: string
}

function TrendCard({ label, icon, iconColor, pools, badge, badgeColor }: TrendCardProps) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, flex: 1, minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: iconColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 600, background: badgeColor + "18", color: badgeColor, borderRadius: 4, padding: "1px 6px", marginLeft: "auto" }}>{badge}</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pools.map((y, i) => (
          <a key={y.id} href={y.depositUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", padding: "6px 8px", borderRadius: 8, background: "var(--bg-elevated)", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", width: 14 }}>{i + 1}</span>
              <ProtocolAvatar y={y} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{y.asset}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{y.protocol}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: iconColor }}>{y.apy.toFixed(2)}%</div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const [yields, setYields] = useState<YieldEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [assetTab, setAssetTab] = useState("All")
  const [categoryTab, setCategoryTab] = useState("All")
  const [lastUpdated, setLastUpdated] = useState(Date.now())

  useEffect(() => {
   fetch("/api/yields").then(r => r.json()).then(d => {
  const allYields = d.yields || []
  
  // DeFiLlama has no staking data for Sui — add seed staking
  const hasStaking = allYields.some((y: any) => y.category === "staking")
  const finalYields = hasStaking ? allYields : [
    ...allYields,
    ...(SEED_STAKING as any[])
  ]
  
  setYields(finalYields)
  setLastUpdated(Date.now())
  setLoading(false)
}).catch(() => setLoading(false))
  }, [])

  const filtered = yields
 .filter(y => categoryTab === "All" ||
  y.category === categoryTab.toLowerCase() ||
  (categoryTab === "Staking" && ((y.category as string) === "lst" || (y.category as string)?.includes("stak")))
)
    .filter(y => assetTab === "All" || y.asset.toUpperCase().includes(assetTab.toUpperCase()))
    .filter(y => search === "" ||
      y.protocol.toLowerCase().includes(search.toLowerCase()) ||
      y.asset.toLowerCase().includes(search.toLowerCase())
    )

  // Trending sections
  const topApy = [...yields].sort((a, b) => b.apy - a.apy).slice(0, 3)
const STABLECOINS = new Set([
  "USDC","USDT","SUIUSDC","SUIUSDT","WUSDC","WUSDT",
  "BUCK","USDY","AUSD","MUSD","SUIUSD","FDUSD","DAI"
])

const topStable = [...yields]
  .filter(y => {
    const asset = y.asset.toUpperCase()
    return !asset.includes("-") && !asset.includes("/") && STABLECOINS.has(asset)
  })
  .sort((a, b) => b.apy - a.apy).slice(0, 3)
  const topTvl = [...yields].sort((a, b) => b.tvl - a.tvl).slice(0, 3)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar lastUpdated={lastUpdated} />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Explore yields</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{yields.length} live pools across Sui DeFi · Updated every 5 minutes</p>
        </div>

        {/* Trending sections */}
        {!loading && yields.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Trending now</div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" as any }}>
              <TrendCard
                label="Highest APY"
                icon={<Flame size={14} style={{ color: "#EF4444" }} />}
                iconColor="#EF4444"
                pools={topApy}
                badge="🔥 Hot"
                badgeColor="#EF4444"
              />
              <TrendCard
                label="Best Stablecoins"
                icon={<Zap size={14} style={{ color: "#4B8BFF" }} />}
                iconColor="#4B8BFF"
                pools={topStable}
                badge="Low risk"
                badgeColor="#4B8BFF"
              />
              <TrendCard
                label="Most Trusted"
                icon={<TrendingUp size={14} style={{ color: "#00D4AA" }} />}
                iconColor="#00D4AA"
                pools={topTvl}
                badge="High TVL"
                badgeColor="#00D4AA"
              />
            </div>
          </div>
        )}

        {/* Loading skeleton for trending */}
        {loading && (
          <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, flex: 1, minWidth: 220, minHeight: 160 }}>
                <div style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 14, width: "60%" }} />
                {[1,2,3].map(j => (
                  <div key={j} style={{ height: 40, background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 8 }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search protocol or token..."
            style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 6, minWidth: "max-content", paddingBottom: 2 }}>
              {CATEGORY_TABS.map(t => (
                <button key={t} onClick={() => setCategoryTab(t)} style={{
                  fontSize: 12, padding: "5px 14px", borderRadius: 20,
                  background: categoryTab === t ? "var(--green)" : "var(--bg-card)",
                  color: categoryTab === t ? "#000" : "var(--text-secondary)",
                  border: `1px solid ${categoryTab === t ? "var(--green)" : "var(--border)"}`,
                  fontWeight: categoryTab === t ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap"
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 6, minWidth: "max-content", paddingBottom: 2 }}>
              {ASSET_TABS.map(t => (
                <button key={t} onClick={() => setAssetTab(t)} style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 20,
                  background: assetTab === t ? "rgba(75,139,255,0.15)" : "var(--bg-card)",
                  color: assetTab === t ? "#4B8BFF" : "var(--text-muted)",
                  border: `1px solid ${assetTab === t ? "rgba(75,139,255,0.4)" : "var(--border)"}`,
                  fontWeight: assetTab === t ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap"
                }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Result count */}
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
          {filtered.length} pool{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
          {categoryTab !== "All" && ` in ${categoryTab}`}
          {assetTab !== "All" && ` for ${assetTab}`}
        </div>

        {/* Table */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 75px 68px", padding: "8px 14px", borderBottom: "1px solid var(--border)", gap: 8 }}>
            {["Protocol / Asset", "APY", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 75px 68px", padding: "12px 14px", borderTop: "1px solid var(--border)", gap: 8 }}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} style={{ height: 16, background: "var(--bg-elevated)", borderRadius: 4 }} />
                ))}
              </div>
            ))
          ) : filtered.map(y => (
            <div key={y.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 75px 68px", padding: "11px 14px", borderTop: "1px solid var(--border)", gap: 8, alignItems: "center", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <ProtocolAvatar y={y} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{y.asset}</span>
                    <span style={{ fontSize: 9, background: "var(--bg-elevated)", color: "var(--text-muted)", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>
                      {y.category === "lending" ? "Lending" : y.category === "dex" ? "DEX" : "Staking"}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{y.protocol} · {fmtTvl(y.tvl)}</div>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: y.apy >= 15 ? "var(--green)" : y.apy >= 7 ? "#4B8BFF" : "var(--text-secondary)" }}>
                {y.apy.toFixed(2)}%
              </div>

              <a href={y.depositUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, fontWeight: 600, color: "#000", background: "var(--green)", borderRadius: 6, padding: "5px 8px", textDecoration: "none", textAlign: "center", whiteSpace: "nowrap", display: "block" }}>
                Open ↗
              </a>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              No pools found — try a different filter
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "right" }}>
          Data from DeFiLlama · Updates every 5 minutes
        </div>
      </div>
    </div>
  )
}