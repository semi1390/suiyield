"use client"
import Link from "next/link"
import { ArrowRight, ChevronRight, Bell, Sparkles, Wallet, TrendingUp, Shield, Zap, BarChart3, Brain, AlertTriangle } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const PROTOCOLS = [
  { name: "Navi Protocol", initials: "N",  color: "#1A4FE0", type: "Lending", logo: "https://cdn.brandfetch.io/idD0jgT0gJ/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1768404148379" },
  { name: "Scallop",       initials: "Sc", color: "#8B5CF6", type: "Lending", logo: "https://icons.llama.fi/scallop.png" },
  { name: "Suilend",       initials: "Sl", color: "#EC4899", type: "Lending", logo: "https://icons.llama.fi/suilend.png" },
  { name: "Cetus",         initials: "C",  color: "#06B6D4", type: "DEX",     logo: "https://icons.llama.fi/cetus.png" },
  { name: "Haedal",        initials: "H",  color: "#3A9FF5", type: "Staking", logo: "https://icons.llama.fi/haedal.png" },
  { name: "Bluefin",       initials: "Bf", color: "#2563EB", type: "DEX",     logo: "https://icons.llama.fi/bluefin.png" },
  { name: "Turbos",        initials: "T",  color: "#F97316", type: "DEX",     logo: "https://icons.llama.fi/turbos-finance.png" },
  { name: "Kai Finance",   initials: "K",  color: "#14B8A6", type: "Lending", logo: "https://icons.llama.fi/kai-finance.png" },
]

const SPECS = [
  { label: "Chain",             value: "Sui Network (L1)" },
  { label: "Data sources",      value: "DeFiLlama + Protocol SDKs" },
  { label: "Live protocols",    value: "Navi · Scallop (SDK)" },
  { label: "Position readers",  value: "Navi · Scallop · Cetus · Haedal" },
  { label: "Update frequency",  value: "Every 5 minutes" },
 { label: "AI advisor", value: "Powered by AI" },
  { label: "Alerts",            value: "Telegram Bot" },
  { label: "Swap",              value: "Cetus 7k Aggregator" },
 { label: "Custody", value: "Non-custodial · Direct to protocol" },
  { label: "Pools tracked",     value: "113+" },
]

const FAQS = [
  { q: "Does SuiYield hold my funds?", a: "No. When you deposit through SuiYield, your transaction goes directly to the protocol — Navi, Scallop, or Cetus. We never hold your funds at any point. The deposit button opens a transaction you sign with your own wallet." },
  { q: "Does SuiYield take a fee?", a: "No. SuiYield charges zero fees. You deposit directly into the protocol at the same rate you'd get going there yourself. We make no cut of your yield." },
  { q: "How is the yield data sourced?", a: "Navi and Scallop rates come directly from their protocol SDKs in real time. All other protocols are sourced from DeFiLlama and updated every 5 minutes." },
  { q: "How does the AI advisor work?", a: "The AI advisor reads your on-chain positions, compares them against every live rate across Sui, and gives you specific actionable insights — not generic advice. It knows your wallet, your APYs, and where you could be earning more." },
  { q: "What chains does SuiYield support?", a: "Sui mainnet only. SuiYield is built specifically for the Sui ecosystem and its DeFi protocols." },
  { q: "How do Telegram alerts work?", a: "Set a threshold for any asset and protocol. Our system checks rates regularly and sends you a Telegram message the moment a pool crosses your target APY." },
  { q: "Which protocols can I deposit into?", a: "Currently Navi Protocol and Scallop via native one-click deposit. All other protocols open directly on their own site with the right asset pre-selected." },
  { q: "Is SuiYield open source?", a: "Yes. The full codebase is available on GitHub at github.com/semi1390/suiyield." },
]

interface LiveRate { protocol: string; asset: string; apy: number; color: string; initials: string; logo?: string }

function ProtocolLogo({ logo, initials, color, size = 30 }: { logo?: string; initials: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700, color, overflow: "hidden", flexShrink: 0 }}>
      {logo && !failed
        ? <img src={logo} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setFailed(true)} />
        : initials}
    </div>
  )
}

function useInView(ref: React.RefObject<HTMLElement>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<HTMLElement>)
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [rates, setRates] = useState<LiveRate[]>([])
  const [loaded, setLoaded] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [stats, setStats] = useState([
    { value: "113+", label: "Live pools" },
    { value: "8+",   label: "Protocols" },
    { value: "4",    label: "Position readers" },
    { value: "$500M+", label: "TVL tracked" },
  ])

  // Ticker items
  const tickerItems = [
    "DEEP · 18.26%", "EEARN · 17.52%", "NS · 16.22%", "DEEP · 14.43%",
    "WAL · 12.48%", "USDC · 9.63%", "SUI · 6.11%", "USDT · 7.22%",
  ]

  useEffect(() => {
    fetch("/api/yields")
      .then(r => r.json())
      .then(d => {
        const allYields = d.yields || []
        const poolCount = allYields.length
        const totalTvl = allYields.reduce((s: number, y: any) => s + (y.tvl || 0), 0)
        if (poolCount > 0) {
          setStats([
            { value: `${poolCount}+`, label: "Live pools" },
            { value: "8+",            label: "Protocols" },
            { value: "4",             label: "Position readers" },
            { value: totalTvl > 1e9
                ? `$${(totalTvl / 1e9).toFixed(1)}B+`
                : `$${(totalTvl / 1e6).toFixed(0)}M+`,
              label: "TVL tracked" },
          ])
        }
      })
      .catch(() => {})

    fetch("/api/live-rates")
      .then(r => r.json())
      .then(d => {
        const liveRates = d.data || []
        const top = liveRates
          .filter((r: any) => (r.apyBase + r.apyReward) > 0)
          .sort((a: any, b: any) => (b.apyBase + b.apyReward) - (a.apyBase + a.apyReward))
          .slice(0, 4)
          .map((r: any) => ({
            protocol: r.protocol === "navi" ? "Navi Protocol" : "Scallop",
            asset: r.symbol,
            apy: r.apyBase + r.apyReward,
            color: r.protocol === "navi" ? "#1A4FE0" : "#8B5CF6",
            initials: r.protocol === "navi" ? "N" : "Sc",
            logo: r.protocol === "navi"
              ? "https://cdn.brandfetch.io/idD0jgT0gJ/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1768404148379"
              : "https://icons.llama.fi/scallop.png",
          }))
        setRates(top)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const FALLBACK_RATES = [
    { protocol: "Navi", asset: "DEEP", apy: 18.26, color: "#1A4FE0", initials: "N", logo: "https://cdn.brandfetch.io/idD0jgT0gJ/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1768404148379" },
    { protocol: "Current", asset: "EEARN", apy: 17.52, color: "#0EA5E9", initials: "Cu", logo: "https://icons.llama.fi/current-finance.png" },
    { protocol: "Navi", asset: "NS", apy: 16.22, color: "#1A4FE0", initials: "N", logo: "https://cdn.brandfetch.io/idD0jgT0gJ/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1768404148379" },
    { protocol: "Scallop", asset: "WAL", apy: 12.48, color: "#8B5CF6", initials: "Sc", logo: "https://icons.llama.fi/scallop.png" },
  ]

  const displayRates = rates.length > 0 ? rates : FALLBACK_RATES

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", overflowX: "hidden", color: "var(--text-primary)" }}>

      {/* Scrolling ticker */}
      <div style={{ background: "rgba(0,212,170,0.06)", borderBottom: "1px solid rgba(0,212,170,0.12)", padding: "8px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 0, animation: "ticker 30s linear infinite", width: "max-content" }}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} style={{ fontSize: 11, color: "#00D4AA", fontWeight: 500, padding: "0 32px", whiteSpace: "nowrap", opacity: 0.8 }}>
              {item} <span style={{ opacity: 0.3, marginLeft: 32 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(10,14,26,0.96)", backdropFilter: "blur(16px)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="SuiYield" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>SuiYield</span>
        </div>
        <div style={{ display: "none" }} className="nav-links-desktop">
          <Link href="/app/explore" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "0 14px" }}>Explore</Link>
          <Link href="/app/positions" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "0 14px" }}>Positions</Link>
          <Link href="/app/portfolio" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "0 14px" }}>Portfolio</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#00D4AA", fontWeight: 500 }}>Live</span>
          </div>
          <Link href="/app" style={{ background: "#00D4AA", color: "#000", borderRadius: 9, padding: "8px 18px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            Launch app <ArrowRight size={12} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ animation: "fadeUp 0.7s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: "#00D4AA", fontWeight: 500 }}>Live on Sui mainnet · {stats[0].value} pools tracked</span>
          </div>

          <h1 style={{ fontSize: "clamp(36px, 7vw, 68px)", fontWeight: 800, color: "#fff", lineHeight: 1.05, marginBottom: 24, letterSpacing: "-0.03em" }}>
            Find the best yield<br />
            across <span style={{ color: "#4B8BFF" }}>Sui</span> —<br />
            <span style={{ color: "#00D4AA" }}>instantly.</span>
          </h1>

          <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
            Real-time yield aggregation across every Sui protocol.<br />
            AI-powered portfolio analysis. On-chain position reading.<br />
            Telegram alerts when rates move.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
            <Link href="/app" style={{ display: "flex", alignItems: "center", gap: 7, background: "#00D4AA", color: "#000", borderRadius: 11, padding: "14px 28px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              Launch app <ArrowRight size={15} />
            </Link>
            <Link href="/app/explore" style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 11, padding: "14px 28px", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
              Explore pools <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* Live rate card */}
        <div style={{ animation: "fadeUp 0.7s ease 0.2s both" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, maxWidth: 500, margin: "0 auto", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Top rates right now</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Direct from protocols</span>
              </div>
            </div>

            {!loaded ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
                    <div>
                      <div style={{ width: 80, height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 4 }} />
                      <div style={{ width: 50, height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ width: 60, height: 20, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
                </div>
              ))
            ) : (
              displayRates.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ProtocolLogo logo={r.logo} initials={r.initials} color={r.color} size={32} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{r.protocol}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{r.asset}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#00D4AA" }}>{r.apy.toFixed(2)}%</div>
                </div>
              ))
            )}

            <Link href="/app" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, padding: "10px", background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#00D4AA", textDecoration: "none" }}>
              See all {stats[0].value} pools <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, textAlign: "center" }}>
          {stats.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#00D4AA", marginBottom: 6, letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* How it works — numbered like Yosuku */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <FadeIn>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: "#00D4AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 12 }}>
              From zero to earning<br />in 60 seconds.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", maxWidth: 400 }}>No sign up. No fees. Connect and go.</p>
          </div>
        </FadeIn>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { num: "01", icon: Wallet,     title: "Connect your wallet",   sub: "One click · Read-only · No approvals", desc: "One click. Read-only connection to your Sui wallet. We never request transaction approvals, never touch your funds, and never store your private keys.", tag: "Non-custodial" },
            { num: "02", icon: TrendingUp, title: "See every opportunity", sub: "113+ pools · 8 protocols · Live rates",  desc: "Every lending rate, DEX pool, and staking yield across Sui — ranked by APY, filterable by asset and risk level, updated every 5 minutes directly from the protocols.", tag: "113+ pools" },
           { num: "03", icon: Brain, title: "Let AI guide you", sub: "AI-powered · Your wallet · Live data", desc: "The AI Yield Advisor reads your exact on-chain positions, compares them to every live rate across the ecosystem, and tells you specifically where your capital should be right now.", tag: "AI-powered advisor" },
            { num: "04", icon: Bell,       title: "Get alerted instantly", sub: "Telegram · Any asset · Any threshold",  desc: "Set a target APY for any asset or protocol. The moment a pool crosses your threshold, you get a Telegram message. Never miss a rate spike again.", tag: "Telegram alerts" },
          ].map((step, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 24, padding: "40px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}
                className="how-it-works-row">
                <div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: "rgba(0,212,170,0.15)", letterSpacing: "-0.04em", lineHeight: 1 }}>{step.num}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }} className="step-inner">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <step.icon size={16} style={{ color: "#00D4AA" }} />
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{step.title}</h3>
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 16 }}>{step.desc}</p>
                    <span style={{ fontSize: 11, color: "#00D4AA", background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 100, padding: "4px 12px", fontWeight: 600 }}>{step.tag}</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{step.sub}</div>
                    {i === 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#00D4AA", fontWeight: 500 }}>✓ Wallet connected</div>
                        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>0xe1ca...635f</div>
                        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Read-only · No approvals needed</div>
                      </div>
                    )}
                    {i === 1 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[["Kai Finance", "DEEP", "18.26%"], ["Current", "EEARN", "17.52%"], ["Navi", "NS", "16.22%"]].map(([p, a, r], j) => (
                          <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                            <div>
                              <div style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{p}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{a}</div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#00D4AA" }}>{r}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {i === 2 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,212,170,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#00D4AA" }}>72</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Portfolio score · Good</div>
                        </div>
                        <div style={{ padding: "10px 12px", background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.1)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                          73.84% above available alternatives — but concentration risk detected.
                        </div>
                      </div>
                    )}
                    {i === 3 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>TELEGRAM · @Suiyield_alerts_bot</div>
                          <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.5 }}>🔔 <strong>SuiYield Alert</strong><br />USDC on Navi just hit 16.22% APY</div>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>Set once. Never miss a spike.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Protocol specs */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
          <FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }} className="specs-grid">
              <div>
                <div style={{ fontSize: 11, color: "#00D4AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Protocol specs</div>
                <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
                  Built for serious<br />DeFi users.
                </h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, maxWidth: 360 }}>
                  SuiYield reads directly from protocol SDKs and on-chain state — not from third-party APIs that lag behind the market.
                </p>
              </div>
              <div>
                {SPECS.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
                    <span style={{ fontSize: 13, color: "#fff", fontWeight: 500, textAlign: "right" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Protocols strip */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <FadeIn>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 32 }}>Protocols supported</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {PROTOCOLS.map((p, i) => (
              <div key={i}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 16px", transition: "border-color 0.2s, background 0.2s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = p.color + "55"; e.currentTarget.style.background = p.color + "0A" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)" }}>
                <ProtocolLogo logo={p.logo} initials={p.initials} color={p.color} size={22} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", borderRadius: 3, padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.type}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* FAQ */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
          <FadeIn>
            <div style={{ fontSize: 11, color: "#00D4AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 48 }}>
              Things people ask,<br /><em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.4)" }}>before they connect.</em>
            </h2>
          </FadeIn>
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", paddingRight: 24 }}>{faq.q}</span>
                  <span style={{ fontSize: 20, color: "rgba(255,255,255,0.3)", flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, paddingBottom: 20 }}>{faq.a}</div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <FadeIn>
          <div style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
            Your capital deserves<br /><span style={{ color: "#00D4AA" }}>a strategy.</span>
          </div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", marginBottom: 36 }}>
            No sign up. No fees. Connect and start earning more — right now.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#00D4AA", color: "#000", borderRadius: 11, padding: "14px 32px", fontSize: 16, fontWeight: 700, textDecoration: "none" }}>
              Launch SuiYield <ArrowRight size={16} />
            </Link>
            <Link href="/app/explore" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 11, padding: "14px 32px", fontSize: 16, fontWeight: 500, textDecoration: "none" }}>
              Browse pools <ChevronRight size={16} />
            </Link>
          </div>
        </FadeIn>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <img src="/logo.png" alt="SuiYield" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>SuiYield</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, maxWidth: 240, marginBottom: 16 }}>
                Real-time DeFi yield aggregation and AI-powered portfolio management on Sui.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 10px" }}>Built on Sui</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 10px" }}>Sui Overflow 2026</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Product</div>
              {[["Dashboard", "/app"], ["Explore", "/app/explore"], ["My Positions", "/app/positions"], ["Portfolio", "/app/portfolio"], ["Alerts", "/app/alerts"], ["Swap", "/app/swap"]].map(([label, href]) => (
                <Link key={href} href={href} style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Protocols</div>
              {["Navi Protocol", "Scallop", "Cetus", "Bluefin", "Haedal", "Kai Finance"].map(p => (
                <div key={p} style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>{p}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Links</div>
              {[["GitHub", "https://github.com/semi1390/suiyield"], ["Telegram Bot", "https://t.me/Suiyield_alerts_bot"], ["Sui Mainnet", "https://suiscan.xyz"]].map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                  {label} ↗
                </a>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 SuiYield · Not financial advice</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>suiyield-umzj.vercel.app</span>
          </div>
        </div>
      </footer>

      <style suppressHydrationWarning>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }

        .nav-links-desktop { display: flex !important; }

        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .how-it-works-row { grid-template-columns: 40px 1fr !important; gap: 12px !important; }
          .step-inner { grid-template-columns: 1fr !important; gap: 16px !important; }
          .specs-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }

        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}