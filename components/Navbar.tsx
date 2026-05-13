"use client"
import { ConnectButton } from "@mysten/dapp-kit"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sun, Menu, X } from "lucide-react"
import { useState } from "react"

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/explore", label: "Explore" },
  { href: "/app/positions", label: "My Positions" },
  { href: "/app/alerts", label: "Alerts" },
  { href: "/app/portfolio", label: "Portfolio" },
  { href: "/app/swap", label: "Swap" },
]

export default function Navbar({ lastUpdated }: { lastUpdated?: number }) {
  const path = usePathname()
  const secs = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }} className="sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--green-bg)", border: "1px solid var(--green-border)" }}>
              <span style={{ color: "var(--green)", fontSize: 14, fontWeight: 600 }}>S</span>
            </div>
            <span style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>SuiYield</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="relative px-3 py-4 text-[13px] transition-colors"
                style={{ color: path === l.href ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {l.label}
                {path === l.href && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: "var(--green)" }} />
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Data updated — desktop only */}
            {secs !== null && (
              <div className="hidden md:flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
                Data updated {secs}s ago
              </div>
            )}
            <button className="hidden md:flex p-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>
              <Sun size={15} />
            </button>
            <div style={{ maxWidth: 160 }}><ConnectButton /></div>
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 border-b"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          {links.map(l => (
            <Link key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-5 py-4 text-[14px] border-b"
              style={{
                color: path === l.href ? "var(--green)" : "var(--text-secondary)",
                borderColor: "var(--border)",
                background: path === l.href ? "var(--green-bg)" : "transparent"
              }}>
              {l.label}
              {path === l.href && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}