import type { RealPosition } from "@/lib/positions"
import { Eye, Loader2 } from "lucide-react"

interface Props {
  positions: RealPosition[]
  connected: boolean
  loading?: boolean
  source?: "live" | "empty" | "demo"
}

export default function PositionsPanel({ positions, connected, loading, source }: Props) {
  const total = positions.reduce((s, p) => s + p.valueUsd, 0)
  const daily = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>My Positions</span>
          <Eye size={13} style={{ color: "var(--text-muted)" }} />
        </div>
        {source === "live" && (
          <span style={{ fontSize: 10, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>
            LIVE
          </span>
        )}
      </div>

      {!connected ? (
        <div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>Connect wallet to view your positions</p>
          <button style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer" }}>
            Connect Wallet
          </button>
        </div>
      ) : loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Reading on-chain positions...
        </div>
      ) : positions.length === 0 ? (
        <div style={{ padding: "16px 0", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>No positions found on Navi or Scallop</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>More protocols coming soon</p>
        </div>
      ) : (
        <div>
          {total > 0 && (
            <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Total deposited</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
              </div>
              {daily > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Daily earnings</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>+${daily.toFixed(2)}</div>
                </div>
              )}
            </div>
          )}
          {positions.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.color + "22", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: p.color }}>
                  {p.initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{p.asset}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.protocol}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                  ${p.valueUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
                {p.apy > 0 && (
                  <div style={{ fontSize: 11, color: "var(--green)" }}>{p.apy.toFixed(2)}% APY</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}