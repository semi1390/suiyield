export type Risk = "low" | "medium" | "high"
export type AssetFilter = "all" | "stablecoins" | "sui" | "lsts" | "btc" | "other"
export type Category = "lending" | "dex" | "staking" | "cex"

export interface YieldEntry {
  id: string
  protocol: string
  asset: string
  type: string
  apy: number
  apyBase?: number
  apyReward?: number
  tvl: number
  risk: Risk
  depositUrl: string
  color: string
  initials: string
  logo?: string
  change24h?: number
  change7d?: number
  category: Category
  poolId?: string
  underlyingTokens?: string[]
  rewardTokens?: string[]
}

export interface Position {
  protocol: string
  asset: string
  valueUsd: number
  apy: number
  color: string
}

export interface AlertItem {
  id: string
  message: string
  type: "increase" | "decrease" | "new"
  time: string
  active: boolean
  asset: string
}