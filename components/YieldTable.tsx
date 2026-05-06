"use client"
import { useState } from "react"
import type { YieldEntry } from "@/types"

type Category = "lending" | "dex" | "staking" | "cex"

const TABS = [
  { key: "lending" as Category, label: "Lending", icon: "⊞", sub: "Supply assets to earn yield" },
  { key: "dex" as Category, label: "DEX Pools", icon: "⇄", sub: "Provide liquidity to earn fees" },
  { key: "staking" as Category, label: "Staking (LST)", icon: "↗", sub: "Liquid staking rewards" },
  { key: "cex" as Category, label: "CEX", icon: "🏦", sub: "Centralised exchange yields", beta: true },
]

const RISK_FILTERS = ["All Risk Levels", "Low", "Medium", "High"]

const ASSET_GROUPS: Record<string, string[]> = {
  "USDC": ["USDC","SUIUSDC","WUSDC","USDC.E"],
  "USDT": ["USDT","SUIUSDT","WUSDT","SBUSDT"],
  "SUI":  ["SUI"],
  "WBTC": ["WBTC","SBWBTC","ZWBTC","XBTC","LBTC","MBTC","ENZOBTC","STBTC","YBTC.B"],
  "WETH": ["WETH","SUIETH","SBETH","ETH"],
  "WAL":  ["WAL","WWAL","HAWAL"],
  "USDY": ["USDY"],
  "DEEP": ["DEEP"],
  "NS":   ["NS"],
  "NAVX": ["NAVX"],
  "CETUS":["CETUS"],
  "HAEDAL":["HAEDAL"],
  "HASUI":["HASUI"],
  "AFSUI":["AFSUI"],
  "VSUI": ["VSUI"],
  "SCA":  ["SCA"],
  "BUCK": ["BUCK"],
  "IKA":  ["IKA"],
}

function fmtTvl(n: number) {
  if (!n) return "—"
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`
  return `$${n}`
}

function Dropdown({ value, options, onChange, prefix = "" }: { value: string; options: string[]; onChange: (v: string) => void; prefix?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 8px", fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", outline: "none" }}>
      {options.map(o => <option key={o} value={o}>{prefix}{o}</option>)}
    </select>
  )
}

interface Props {
  lending: YieldEntry[]; dex: YieldEntry[]; staking: YieldEntry[]; cex: YieldEntry[]
}

export default function YieldTable({ lending, dex, staking, cex }: Props) {
  const [tab, setTab] = useState<Category>("lending")
  const [assetFilter, setAssetFilter] = useState("All Assets")
  const [riskFilter, setRiskFilter] = useState("All Risk Levels")
  const [sortBy, setSortBy] = useState("APY High to Low")
  const [showMore, setShowMore] = useState(false)

  const dataMap = { lending, dex, staking, cex }

  const activeAssets = new Set(dataMap[tab].map(y => y.asset))
  const availableGroups = Object.entries(ASSET_GROUPS)
    .filter(([_, variants]) => variants.some(v => activeAssets.has(v)))
    .map(([group]) => group)
  const allAssets = ["All Assets", ...availableGroups]

  const handleTabChange = (newTab: Category) => {
    setTab(newTab)
    setShowMore(false)
    setAssetFilter("All Assets")
  }

  const assetVariants = assetFilter !== "All Assets"
    ? new Set(ASSET_GROUPS[assetFilter] || [assetFilter])
    : null

  let rows = dataMap[tab]
    .filter(y => assetVariants === null || assetVariants.has(y.asset))
    .filter(y => riskFilter === "All Risk Levels" || y.risk === riskFilter.toLowerCase())
    .sort((a, b) => sortBy === "APY High to Low" ? b.apy - a.apy : a.apy - b.apy)

  const visible = showMore ? rows : rows.slice(0, 6)
  const currentTab = TABS.find(t => t.key === tab)!

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>

      {/* Tabs + filters */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        {/* Tab row */}
        <div style={{ display: "flex", alignItems: "center", overflowX: "auto", padding: "0 8px" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "12px 10px", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
                color: tab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
                borderBottom: tab === t.key ? "2px solid var(--green)" : "2px solid transparent",
                background: "transparent", border: "none",
                cursor: "pointer",
              }}>
              {t.label}
              {t.beta && <span style={{ fontSize: 9, background: "rgba(75,139,255,0.15)", color: "#4B8BFF", borderRadius: 4, padding: "1px 4px" }}>Beta</span>}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div style={{ display: "flex", gap: 6, padding: "8px 12px", overflowX: "auto" }}>
          <Dropdown value={assetFilter} options={allAssets} onChange={setAssetFilter} />
          <Dropdown value={riskFilter} options={RISK_FILTERS} onChange={setRiskFilter} />
          <Dropdown value={sortBy} options={["APY High to Low", "APY Low to High"]} onChange={setSortBy} prefix="Sort: " />
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{currentTab.label} markets</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{currentTab.sub}</div>
      </div>

      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 70px 80px", padding: "6px 12px", gap: 4, borderBottom: "1px solid var(--border)" }}>
        {["PROTOCOL", "ASSET", "APY ↑", "ACTION"].map(h => (
          <div key={h} style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {visible.map((y, i) => (
        <div key={y.id}
          style={{ display: "grid", gridTemplateColumns: "1fr 60px 70px 80px", padding: "10px 12px", gap: 4, alignItems: "center", borderTop: "1px solid var(--border)", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {/* Protocol */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: y.color + "22", border: `1px solid ${y.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: y.color, flexShrink: 0 }}>
              {y.initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{y.protocol}</span>
                {i === 0 && <span style={{ fontSize: 9, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 3, padding: "1px 4px", fontWeight: 600, flexShrink: 0 }}>Best</span>}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{y.type} · {fmtTvl(y.tvl)}</div>
            </div>
          </div>

          {/* Asset */}
          <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{y.asset}</div>

          {/* APY */}
          <div style={{ fontSize: 14, fontWeight: 700, color: y.apy >= 12 ? "var(--green)" : y.apy >= 7 ? "#4B8BFF" : "var(--text-secondary)" }}>
            {y.apy.toFixed(2)}%
          </div>

          {/* Action */}
          <div>
            <a href={y.depositUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, fontWeight: 600, color: "#000", background: "var(--green)", borderRadius: 7, padding: "5px 8px", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}>
              Deposit
            </a>
          </div>
        </div>
      ))}

      {rows.length > 6 && (
        <button onClick={() => setShowMore(s => !s)}
          style={{ width: "100%", padding: "12px", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", background: "transparent", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
          {showMore ? "Show less" : `Show more (${rows.length - 6} more) ▾`}
        </button>
      )}
    </div>
  )
}