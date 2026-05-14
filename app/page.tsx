"use client"
import Link from "next/link"
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

const STATS = [
  { value: "112+", label: "Live pools" },
  { value: "8", label: "Protocols" },
  { value: "5min", label: "Updates" },
  { value: "$500M+", label: "TVL tracked" },
]

const FEATURES = [
  { icon: TrendingUp, title: "Best rates, always", desc: "Every Sui protocol scanned every 5 minutes. You always see the top opportunity." },
  { icon: Zap, title: "One-click deposits", desc: "Click Deposit and land directly on the protocol's page. No hunting around." },
  { icon: BarChart3, title: "Portfolio tracking", desc: "Connect your wallet to see all your balances, positions and earnings in one view." },
  { icon: Shield, title: "Non-custodial", desc: "Read-only wallet connection. We never touch your funds." },
]

const PROTOCOLS = [
  { name: "Navi Protocol", initials: "N",  color: "#1A4FE0", type: "Lending", logo: "https://icons.llama.fi/navi-protocol.png" },
  { name: "Scallop",       initials: "Sc", color: "#8B5CF6", type: "Lending", logo: "https://icons.llama.fi/scallop.png" },
  { name: "Suilend",       initials: "Sl", color: "#EC4899", type: "Lending", logo: "https://icons.llama.fi/suilend.png" },
  { name: "Cetus LP",      initials: "C",  color: "#06B6D4", type: "DEX",     logo: "https://icons.llama.fi/cetus.png" },
  { name: "Bluefin",       initials: "Bf", color: "#2563EB", type: "DEX",     logo: "https://icons.llama.fi/bluefin.png" },
  { name: "Turbos",        initials: "T",  color: "#F97316", type: "DEX",     logo: "https://icons.llama.fi/turbos-finance.png" },
  { name: "Current",       initials: "Cu", color: "#0EA5E9", type: "Yield",   logo: "https://icons.llama.fi/current.png" },
  { name: "Kai Finance",   initials: "K",  color: "#14B8A6", type: "Lending", logo: "https://icons.llama.fi/kai-finance.png" },
]

interface LiveRate { protocol: string; asset: string; apy: number; color: string; initials: string; logo?: string; depositUrl: string }

function ProtocolLogo({ logo, initials, color, size = 30 }: { logo?: string; initials: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700, color, overflow: "hidden", flexShrink: 0 }}>
      {logo && !failed ? (
        <img src={logo} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </div>
  )
}

export default function LandingPage() {
  const [rates, setRates] = useState<LiveRate[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/yields")
      .then(r => r.json())
      .then(d => {
        const top = (d.yields || [])
          .sort((a: any, b: any) => b.apy - a.apy)
          .slice(0, 4)
          .map((y: any) => ({ protocol: y.protocol, asset: y.asset, apy: y.apy, color: y.color, initials: y.initials, logo: y.logo, depositUrl: y.depositUrl }))
        setRates(top)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", fontFamily: "var(--font-sans)", overflowX: "hidden" }}>

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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 20px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#00D4AA", fontWeight: 500 }}>Live on Sui mainnet · 112+ pools tracked</span>
        </div>

        <h1 style={{ fontSize: "clamp(32px, 7vw, 58px)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
          Find the best yield<br />
          across <span style={{ color: "#4B8BFF" }}>Sui</span> —{" "}
          <span style={{ color: "#00D4AA" }}>instantly.</span>
        </h1>

        <p style={{ fontSize: "clamp(14px, 2.5vw, 17px)", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>
          Compare lending, DEX pools and staking yields across every Sui protocol. Updated every 5 minutes from on-chain data.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 52 }}>
          <Link href="/app" style={{ display: "flex", alignItems: "center", gap: 7, background: "#00D4AA", color: "#000", borderRadius: 11, padding: "12px 24px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            View live rates <ArrowRight size={15} />
          </Link>
          <Link href="/app/explore" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-card)", border: "1px solid var(--border-bright)", color: "var(--text-primary)", borderRadius: 11, padding: "12px 24px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Explore all pools <ChevronRight size={15} />
          </Link>
        </div>

        {/* Live rate preview card */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 18, padding: 20, maxWidth: 500, margin: "0 auto", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Top rates right now</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00D4AA", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Live from DeFiLlama</span>
            </div>
          </div>

          {!loaded ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-elevated)", animation: "shimmer 1.5s infinite" }} />
                  <div>
                    <div style={{ width: 80, height: 12, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 4 }} />
                    <div style={{ width: 50, height: 10, background: "var(--bg-elevated)", borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ width: 60, height: 20, background: "var(--bg-elevated)", borderRadius: 4 }} />
              </div>
            ))
          ) : rates.length > 0 ? (
            rates.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProtocolLogo logo={r.logo} initials={r.initials} color={r.color} size={30} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.protocol}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.asset}</div>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#00D4AA" }}>{r.apy.toFixed(2)}%</div>
              </div>
            ))
          ) : (
            [
              { protocol: "Navi", asset: "DEEP", apy: "23.92%", color: "#1A4FE0", initials: "N", logo: "https://icons.llama.fi/navi-protocol.png" },
              { protocol: "Bluefin", asset: "WAL-SUI", apy: "72.45%", color: "#2563EB", initials: "Bf", logo: "https://icons.llama.fi/bluefin.png" },
              { protocol: "Cetus", asset: "USDC-SUI", apy: "55.71%", color: "#06B6D4", initials: "C", logo: "https://icons.llama.fi/cetus.png" },
              { protocol: "Current", asset: "USDC", apy: "9.63%", color: "#0EA5E9", initials: "Cu", logo: "https://icons.llama.fi/current.png" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProtocolLogo logo={r.logo} initials={r.initials} color={r.color} size={30} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.protocol}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.asset}</div>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#00D4AA" }}>{r.apy}</div>
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
          {STATS.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, color: "#00D4AA", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Everything in one place</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 380, margin: "0 auto" }}>Track, compare and act on every yield opportunity on Sui.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,212,170,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <f.icon size={16} style={{ color: "#00D4AA" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocols */}
      <div style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "40px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 24 }}>Protocols tracked</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {PROTOCOLS.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 9, padding: "7px 12px" }}>
                <ProtocolLogo logo={p.logo} initials={p.initials} color={p.color} size={20} />
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 3, padding: "1px 4px" }}>{p.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 20px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 12, letterSpacing: "-0.02em" }}>
          Start earning more today
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>
          No sign up. No fees. Just better yields.
        </p>
        <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#00D4AA", color: "#000", borderRadius: 11, padding: "13px 28px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          Open SuiYield <ArrowRight size={15} />
        </Link>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#00D4AA" }}>S</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>SuiYield</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/app" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>App</Link>
            <Link href="/app/explore" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Explore</Link>
            <Link href="/app/portfolio" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>Portfolio</Link>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Built on Sui · Not financial advice</span>
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