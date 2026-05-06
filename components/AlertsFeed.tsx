"use client"
import type { AlertItem, YieldEntry, Position } from "@/types"
import { Bell, ExternalLink, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export function AlertsFeed({ alerts }: { alerts: AlertItem[] }) {
  const [items, setItems] = useState(alerts)
  const toggle = (id: string) => setItems(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={14} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Rate Alerts</span>
        </div>
        <button style={{ fontSize: 12, color: "var(--green)", background: "none", border: "none", cursor: "pointer" }}>View all</button>
      </div>
      <div>
        {items.map((a, i) => (
          <div key={a.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0",
            borderTop: i > 0 ? "1px solid var(--border)" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: a.active ? "var(--green-bg)" : "var(--bg-elevated)",
                border: `1px solid ${a.active ? "var(--green-border)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 600, color: a.active ? "var(--green)" : "var(--text-muted)"
              }}>
                {a.asset.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: a.active ? "var(--green)" : "var(--text-muted)", marginTop: 1 }}>
                  {a.active ? `Active • ${a.time}` : "Paused"}
                </div>
              </div>
            </div>
            <button onClick={() => toggle(a.id)} style={{
              width: 36, height: 20, borderRadius: 10, position: "relative",
              background: a.active ? "var(--green)" : "var(--bg-elevated)",
              border: `1px solid ${a.active ? "var(--green)" : "var(--border)"}`,
              cursor: "pointer", transition: "background 0.2s", flexShrink: 0
            }}>
              <div style={{
                position: "absolute", top: 2, width: 14, height: 14, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                left: a.active ? 19 : 2
              }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EarnMoreCard({ yields, positions }: { yields: YieldEntry[]; positions: Position[] }) {
  if (positions.length === 0) return null

  const currentPos = positions[0]
  const better = yields.filter(y => y.asset === currentPos.asset && y.protocol !== currentPos.protocol && y.category === "lending").sort((a, b) => b.apy - a.apy)[0]

  if (!better || better.apy <= currentPos.apy + 0.5) return null

  const extraApy = better.apy - currentPos.apy
  const extraPerYear = (currentPos.valueUsd * extraApy) / 100

  return (
    <div style={{
      background: "var(--bg-card2)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 20
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>You could earn more</span>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--text-muted)", cursor: "help" }}>?</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>You're earning</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-secondary)" }}>{currentPos.apy.toFixed(2)}%</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: currentPos.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: currentPos.color }}>
              {currentPos.asset.charAt(0)}
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>on {currentPos.asset}</span>
          </div>
        </div>

        <div style={{ fontSize: 18, color: "var(--text-muted)" }}>›</div>

        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Best available</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--green)" }}>{better.apy.toFixed(2)}%</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: better.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: better.color }}>
              {better.initials}
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>on {better.protocol}</span>
          </div>
        </div>
      </div>

      <div style={{
        background: "rgba(0,212,170,0.06)", border: "1px solid var(--green-border)",
        borderRadius: 10, padding: "10px 14px", marginBottom: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>That's up to</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>+{extraApy.toFixed(2)}% extra APY</span>
      </div>

      <a href={better.depositUrl} target="_blank" rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "11px", borderRadius: 10,
          background: "var(--green)", color: "#000", fontSize: 13, fontWeight: 600,
          textDecoration: "none", transition: "opacity 0.15s"
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        Move funds <ExternalLink size={13} />
      </a>
    </div>
  )
}

export function AlertsPromo() {
  return (
    <div style={{
      background: "var(--bg-card2)", border: "1px solid var(--border)",
      borderRadius: 16, padding: 20, position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.15, fontSize: 80 }}>🔔</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Get real-time yield alerts</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
        Never miss better rates. Get notified on Telegram or Email.
      </div>
      <button style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500,
        color: "var(--text-primary)", cursor: "pointer"
      }}>
        Set up alerts <ExternalLink size={12} />
      </button>
    </div>
  )
}
