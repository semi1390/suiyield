"use client"
import { ConnectButton } from "@mysten/dapp-kit"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sun, Moon, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

const links = [
  { href: "/app",            label: "Dashboard" },
  { href: "/app/explore",    label: "Explore" },
  { href: "/app/positions",  label: "My Positions" },
  { href: "/app/alerts",     label: "Alerts" },
  { href: "/app/portfolio",  label: "Portfolio" },
  { href: "/app/swap",       label: "Swap" },
]

export default function Navbar({ lastUpdated }: { lastUpdated?: number }) {
  const path = usePathname()
  const secs = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [path])
  // Close menu on scroll
useEffect(() => {
  if (!menuOpen) return
  const handleScroll = () => setMenuOpen(false)
  window.addEventListener("scroll", handleScroll, { passive: true })
  return () => window.removeEventListener("scroll", handleScroll)
}, [menuOpen])

// Close menu on click outside
useEffect(() => {
  if (!menuOpen) return
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest("nav") && !target.closest("[data-mobile-menu]")) {
      setMenuOpen(false)
    }
  }
  document.addEventListener("click", handleClick)
  return () => document.removeEventListener("click", handleClick)
}, [menuOpen])

  return (
    <>
      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <img src="/logo.png" alt="SuiYield" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />
            <span style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>SuiYield</span>
          </Link>

          {/* Desktop nav links */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center" }}>
              {links.map(l => (
                <Link key={l.href} href={l.href}
                  style={{ position: "relative", padding: "16px 12px", fontSize: 13, textDecoration: "none", color: path === l.href ? "var(--text-primary)" : "var(--text-secondary)", transition: "color 0.15s" }}>
                  {l.label}
                  {path === l.href && (
                    <div style={{ position: "absolute", bottom: 0, left: 12, right: 12, height: 2, borderRadius: 2, background: "var(--green)" }} />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            {/* Live indicator — desktop */}
            {!isMobile && secs !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
                Data updated {secs}s ago
              </div>
            )}

            {/* Wallet connect */}
    <div style={{ 
  flexShrink: 0,
  zoom: isMobile ? 0.75 : 1,
}}>
  <ConnectButton />
</div>
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ padding: 8, borderRadius: 8, background: menuOpen ? "var(--bg-elevated)" : "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
     {menuOpen && isMobile && (
  <>
    <div
      onClick={() => setMenuOpen(false)}
      style={{ position: "fixed", inset: 0, top: 56, zIndex: 48, background: "rgba(0,0,0,0.4)" }}
    />
    <div data-mobile-menu style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 49, background: "var(--bg-card)", borderBottom: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          {links.map((l, i) => (
            <Link key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                fontSize: 14, fontWeight: path === l.href ? 600 : 400,
                color: path === l.href ? "var(--green)" : "var(--text-secondary)",
                background: path === l.href ? "var(--green-bg)" : "transparent",
                textDecoration: "none",
              }}>
              {l.label}
              {path === l.href && (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              )}
            </Link>
          ))}

          {/* Live indicator in mobile menu */}
          {secs !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
              Data updated {secs}s ago
            </div>
          )}
        </div>
        </>
      )}

     <style suppressHydrationWarning>{`
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @media (max-width: 768px) {
    .wkit-connected-button,
    .wkit-button,
    [class*="ConnectButton"],
    [class*="connect-button"] {
      font-size: 11px !important;
      padding: 6px 10px !important;
      height: 32px !important;
      min-width: unset !important;
      max-width: 110px !important;
      background: var(--bg-elevated) !important;
      border: 1px solid var(--border) !important;
      color: var(--text-primary) !important;
      border-radius: 8px !important;
    }
  }
`}</style>
    </>
  )
}