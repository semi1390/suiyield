"use client"
import { useState, useEffect } from "react"
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Zap, ChevronRight } from "lucide-react"
import type { RealPosition } from "@/lib/positions"

interface Insight {
  type: "opportunity" | "risk" | "signal"
  title: string
  body: string
  metric?: string
  urgency: "high" | "medium" | "low"
}

interface Analysis {
  summary: string
  score: number
  scoreLabel: string
  insights: Insight[]
}

interface WalletToken {
  symbol: string
  valueUsd: number
  balance: number
}

interface LiveRate {
  protocol: string
  symbol: string
  apyBase: number
  apyReward: number
  tvlUsd: number
}

interface Props {
  positions: RealPosition[]
  walletTokens: WalletToken[]
  connected: boolean
  positionsLoading?: boolean
}

const URGENCY_COLORS = {
  high:   { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  text: "#EF4444" },
  medium: { bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)", text: "#F5A623" },
  low:    { bg: "rgba(0,212,170,0.08)",  border: "rgba(0,212,170,0.2)",  text: "var(--green)" },
}

const TYPE_ICONS = {
  opportunity: TrendingUp,
  risk:        AlertTriangle,
  signal:      Zap,
}

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "var(--green)" : score >= 60 ? "#F5A623" : "#EF4444"

const CACHE_KEY = "suiyield_ai_analysis"
const CACHE_TTL = 10 * 60 * 1000

export default function AiAdvisor({ positions, walletTokens, connected, positionsLoading }: Props) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [activeInsight, setActiveInsight] = useState<number>(0)
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null)

  // Load from cache on mount
  useEffect(() => {
    if (!connected) return
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { analysis: a, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) {
          setAnalysis(a)
          setLastUpdated(new Date(ts))
          setActiveInsight(0)
        }
      }
    } catch {}
  }, [connected])

  async function runAnalysis(force = false) {
    if (!force) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { analysis: a, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            setAnalysis(a)
            setLastUpdated(new Date(ts))
            return
          }
        }
      } catch {}
    }

    setLoading(true)
    setError("")
    try {
      const ratesRes = await fetch("/api/live-rates")
      const ratesData = await ratesRes.json()
      const rates: LiveRate[] = ratesData.data ?? []

      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: positions.map(p => ({
            protocol: p.protocol,
            asset: p.asset,
            valueUsd: p.valueUsd,
            apy: (p as any).apyDisplay ?? p.apy,
          })),
          rates: rates.map(r => ({
            protocol: r.protocol,
            symbol: r.symbol,
            apy: r.apyBase + r.apyReward,
            tvlUsd: r.tvlUsd,
          })),
          walletTokens: walletTokens.filter((t: any) => t.valueUsd >= 0.5),
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Analysis failed")

      const now = Date.now()
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ analysis: data.analysis, ts: now }))
      setAnalysis(data.analysis)
      setLastUpdated(new Date(now))
      setActiveInsight(0)
    } catch (err: any) {
      setError(err.message ?? "Analysis failed")
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, overflow: "hidden", maxWidth: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Sparkles size={16} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>AI Yield Advisor</span>
          <span style={{ fontSize: 9, background: "rgba(75,139,255,0.15)", color: "#4B8BFF", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>BETA</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
          Connect your wallet for personalized yield optimization powered by AI.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["Find better rates for your assets", "Spot portfolio concentration risks", "Get notified of APY movements"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!analysis && !loading) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Sparkles size={16} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>AI Yield Advisor</span>
          <span style={{ fontSize: 9, background: "rgba(75,139,255,0.15)", color: "#4B8BFF", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>BETA</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
          Get AI-powered analysis of your portfolio — find better rates, spot risks, and optimize your yield strategy.
        </div>
        {error && (
          <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
            {error}
          </div>
        )}
        {positionsLoading ? (
          <div style={{ width: "100%", padding: "12px", borderRadius: 12, background: "var(--bg-elevated)", border: "1px solid var(--border)", fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>
            Loading positions first...
          </div>
        ) : (
          <button onClick={() => runAnalysis(true)}
            style={{ width: "100%", padding: "12px", borderRadius: 12, background: "var(--green)", color: "#000", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Sparkles size={14} />
            Analyze My Portfolio
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Sparkles size={16} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>AI Yield Advisor</span>
        </div>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>Analyzing your portfolio...</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Comparing rates across all Sui protocols</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    )
  }

  if (!analysis) return null

  const activeIns = analysis.insights[activeInsight]

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>AI Yield Advisor</span>
          <span style={{ fontSize: 9, background: "rgba(75,139,255,0.15)", color: "#4B8BFF", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>BETA</span>
        </div>
        <button onClick={() => runAnalysis(true)} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "var(--text-muted)", cursor: "pointer" }}>
          <RefreshCw size={10} />
          Refresh
        </button>
      </div>
<div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-elevated)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, minWidth: 0, overflow: "hidden" }}>
      {/* Score */}
      
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: SCORE_COLOR(analysis.score), lineHeight: 1 }}>{analysis.score}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{analysis.scoreLabel}</div>
        </div>
        <div style={{ width: 1, height: 36, background: "var(--border)" }} />
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", wordBreak: "break-word" }}>{analysis.summary}</div>
      </div>

      {/* Insight tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", WebkitOverflowScrolling: "touch" as any, maxWidth: "100%" }}>
        {analysis.insights.map((ins, i) => {
          const Icon = TYPE_ICONS[ins.type]
          const urg = URGENCY_COLORS[ins.urgency]
          return (
            <button key={i} onClick={() => setActiveInsight(i)}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: `1px solid ${activeInsight === i ? urg.border : "var(--border)"}`,
                background: activeInsight === i ? urg.bg : "transparent",
                color: activeInsight === i ? urg.text : "var(--text-muted)",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}>
              <Icon size={10} />
              {ins.title.split(" ").slice(0, 3).join(" ")}
            </button>
          )
        })}
      </div>

      {/* Active insight */}
      {activeIns && (() => {
        const Icon = TYPE_ICONS[activeIns.type]
        const urg = URGENCY_COLORS[activeIns.urgency]
        return (
          <div style={{ background: urg.bg, border: `1px solid ${urg.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <Icon size={14} style={{ color: urg.text, flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{activeIns.title}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: activeIns.metric ? 10 : 0, wordBreak: "break-word", overflow: "hidden" }}>
  {activeIns.body}
</div>
            {activeIns.metric && (
              <div style={{ fontSize: 14, fontWeight: 700, color: urg.text }}>{activeIns.metric}</div>
            )}
          </div>
        )
      })()}

      {/* CTA */}
      {activeIns?.type === "opportunity" && (
        <a href="/app"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px", borderRadius: 10, background: "var(--green)", color: "#000", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          View opportunities <ChevronRight size={13} />
        </a>
      )}

      {lastUpdated && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
          Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
        </div>
      )}
    </div>
  )
}