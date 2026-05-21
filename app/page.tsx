"use client"
import Link from "next/link"
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, ChevronRight, Bell, Sparkles, Wallet } from "lucide-react"
import { useEffect, useState } from "react"

const HOW_IT_WORKS = [
  { step: "01", icon: Wallet,     title: "Connect your wallet",    desc: "One click. Read-only connection. We never touch your funds or ask for approvals." },
  { step: "02", icon: TrendingUp, title: "See every opportunity",  desc: "All lending, DEX and staking yields across Sui — live, ranked, filterable." },
  { step: "03", icon: Sparkles,   title: "Let AI guide you",       desc: "Our AI advisor reads your positions and tells you exactly where to move capital for better returns." },
  { step: "04", icon: Bell,       title: "Get alerted instantly",  desc: "Set Telegram alerts for any protocol or asset. Never miss a rate spike again." },
]

const FEATURES = [
  { icon: TrendingUp, title: "Best rates, always",  desc: "Every Sui protocol scanned every 5 minutes. You always see the top opportunity." },
  { icon: Zap,        title: "One-click deposits",  desc: "Click Deposit and land directly on the protocol's page with the right asset pre-selected." },
  { icon: BarChart3,  title: "Portfolio tracking",  desc: "Connect your wallet to see all your balances, positions and earnings in one view." },
  { icon: Shield,     title: "Non-custodial",       desc: "Read-only wallet connection. We never hold or move your funds." },
  { icon: Sparkles,   title: "AI Yield Advisor",    desc: "AI-powered analysis of your portfolio — find better rates, spot risks, optimize yield." },
  { icon: Bell,       title: "Telegram alerts",     desc: "Get notified when rates move above your threshold. Never miss a better opportunity." },
]

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

export default function LandingPage() {
  const [rates, setRates] = useState<LiveRate[]>([])
  const [loaded, setLoaded] = useState(false)
  const [stats, setStats] = useState([
    { value: "112+",   label: "Live pools" },
    { value: "8+",     label: "Protocols" },
    { value: "4",      label: "Position readers" },
    { value: "$500M+", label: "TVL tracked" },
  ])

  useEffect(() => {
    // Fetch stats from DeFiLlama
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

    // Fetch live rates direct from protocol SDKs
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
    { protocol: "Navi", asset: "DEEP", apy: 23.92, color: "#1A4FE0", initials: "N",logo: "https://cdn.brandfetch.io/idD0jgT0gJ/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1768404148379", },
    { protocol: "Scallop", asset: "WAL", apy: 18.45, color: "#8B5CF6", initials: "Sc", logo: "https://icons.llama.fi/scallop.png" },
    { protocol: "Navi", asset: "USDC", apy: 14.20, color: "#1A4FE0", initials: "N", logo: "https://icons.llama.fi/navi-protocol.png" },
    { protocol: "Scallop", asset: "SUI", apy: 9.63, color: "#8B5CF6", initials: "Sc", logo: "https://icons.llama.fi/scallop.png" },
  ]

  const displayRates = rates.length > 0 ? rates : FALLBACK_RATES

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", overflowX: "hidden" }}>

      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(10,14,26,0.95)", backdropFilter: "blur(12px)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#00D4AA" }}>S</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>SuiYield</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#00D4AA", fontWeight: 500 }}>Live</span>
          </div>
          <Link href="/app" style={{ background: "#00D4AA", color: "#000", borderRadius: 9, padding: "7px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            Launch app <ArrowRight size={12} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "70px 20px 52px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#00D4AA", fontWeight: 500 }}>Live on Sui mainnet · 112+ pools tracked</span>
        </div>

        <h1 style={{ fontSize: "clamp(34px, 7vw, 62px)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.08, marginBottom: 22, letterSpacing: "-0.03em" }}>
          Find the best yield<br />
          across <span style={{ color: "#4B8BFF" }}>Sui</span> —{" "}
          <span style={{ color: "#00D4AA" }}>instantly.</span>
        </h1>

        <p style={{ fontSize: "clamp(14px, 2.5vw, 17px)", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 36px" }}>
          SuiYield aggregates every lending, DEX and staking yield on Sui. AI-powered portfolio analysis. Real-time position tracking. Telegram alerts.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
          <Link href="/app" style={{ display: "flex", alignItems: "center", gap: 7, background: "#00D4AA", color: "#000", borderRadius: 11, padding: "13px 26px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Launch app <ArrowRight size={15} />
          </Link>
          <Link href="/app/explore" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 11, padding: "13px 26px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Explore pools <ChevronRight size={15} />
          </Link>
        </div>

        {/* Live rate preview */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 18, padding: 20, maxWidth: 480, margin: "0 auto", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Top rates right now</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Direct from protocols</span>
            </div>
          </div>

          {!loaded ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-elevated)", animation: "shimmer 1.5s infinite" }} />
                  <div>
                    <div style={{ width: 80, height: 12, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 4, animation: "shimmer 1.5s infinite" }} />
                    <div style={{ width: 50, height: 10, background: "var(--bg-elevated)", borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
                  </div>
                </div>
                <div style={{ width: 60, height: 20, background: "var(--bg-elevated)", borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
              </div>
            ))
          ) : (
            displayRates.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProtocolLogo logo={r.logo} initials={r.initials} color={r.color} size={30} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.protocol}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.asset}</div>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#00D4AA" }}>
                  {typeof r.apy === "number" ? `${r.apy.toFixed(2)}%` : r.apy}
                </div>
              </div>
            ))
          )}

          <Link href="/app" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, padding: "9px", background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#00D4AA", textDecoration: "none" }}>
            See all pools <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", padding: "28px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, textAlign: "center" }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, color: "#00D4AA", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 20px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#00D4AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>How it works</div>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>From zero to earning in 60 seconds</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto" }}>No sign up required. No fees. Connect and go.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: -10, fontSize: 80, fontWeight: 900, color: "rgba(0,212,170,0.04)", lineHeight: 1, userSelect: "none" }}>{step.step}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <step.icon size={16} style={{ color: "#00D4AA" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#00D4AA", background: "rgba(0,212,170,0.1)", borderRadius: 4, padding: "2px 7px" }}>Step {step.step}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: "#00D4AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Features</div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Everything in one place</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 380, margin: "0 auto" }}>Track, compare and act on every yield opportunity on Sui.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,212,170,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <f.icon size={16} style={{ color: "#00D4AA" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocols */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 28 }}>Protocols supported</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {PROTOCOLS.map((p, i) => (
            <div key={i}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 14px", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = p.color + "66")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
              <ProtocolLogo logo={p.logo} initials={p.initials} color={p.color} size={22} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{p.name}</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--bg-elevated)", borderRadius: 3, padding: "1px 5px" }}>{p.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "72px 20px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Sparkles size={24} style={{ color: "#00D4AA" }} />
          </div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 12, letterSpacing: "-0.02em" }}>
            Start earning more today
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
            No sign up. No fees. Just better yields.<br />Connect your wallet and let SuiYield do the work.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#00D4AA", color: "#000", borderRadius: 11, padding: "13px 28px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              Launch SuiYield <ArrowRight size={15} />
            </Link>
            <Link href="/app/explore" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 11, padding: "13px 28px", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
              Browse pools <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#00D4AA" }}>S</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>SuiYield</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>— Built on Sui</span>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/app" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/app/explore" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Explore</Link>
            <Link href="/app/positions" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Positions</Link>
            <Link href="/app/portfolio" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Portfolio</Link>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Not financial advice</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}