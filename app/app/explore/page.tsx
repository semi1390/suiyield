"use client"
import { useEffect, useState } from "react"
import Navbar from "@/components/Navbar"
import type { YieldEntry } from "@/types"
import { Search } from "lucide-react"

const ASSET_TABS = ["All", "USDC", "USDT", "SUI", "WBTC", "WETH", "DEEP"]
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
      {y.logo && !imgFailed ? (
        <img src={y.logo} alt={y.protocol} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgFailed(true)} />
      ) : (
        <span style={{ fontSize: 9, fontWeight: 700, color: y.color }}>{y.initials}</span>
      )}
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
      setYields(d.yields || [])
      setLastUpdated(Date.now())
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = yields
    .filter(y => categoryTab === "All" || y.category === categoryTab.toLowerCase())
    .filter(y => assetTab === "All" || y.asset.toUpperCase().includes(assetTab.toUpperCase()))
    .filter(y => search === "" ||
      y.protocol.toLowerCase().includes(search.toLowerCase()) ||
      y.asset.toLowerCase().includes(search.toLowerCase())
    )

  const topByApy = [...yields].sort((a, b) => b.apy - a.apy).slice(0, 3)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar lastUpdated={lastUpdated} />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px" }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Explore yields</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{yields.length} live pools across Sui DeFi</p>
        </div>

        {/* Top picks */}
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, minWidth: "max-content", paddingBottom: 4 }}>
            {topByApy.map(y => (
              <div key={y.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, width: 200, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <ProtocolAvatar y={y} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{y.protocol}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{y.asset} · {y.type}</div>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>{y.apy.toFixed(2)}%</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>TVL: {fmtTvl(y.tvl)}</span>
                  <a href={y.depositUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, fontWeight: 600, color: "#000", background: "var(--green)", borderRadius: 6, padding: "4px 10px", textDecoration: "none" }}>
                    Open ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search protocol or token..."
            style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Category + Asset filters */}
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
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No pools found</div>
          )}
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "right" }}>
          Live data from DeFiLlama · Updates every 5 minutes
        </div>
      </div>
    </div>
  )
}