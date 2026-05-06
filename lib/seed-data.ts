import type { YieldEntry, Position, AlertItem } from "@/types"

export const SEED_LENDING: YieldEntry[] = [
  { id: "navi-usdc", protocol: "Navi Protocol", asset: "USDC", type: "Lending", apy: 14.20, tvl: 215600000, risk: "low", depositUrl: "https://app.naviprotocol.io", color: "#1A4FE0", initials: "N", change24h: 2.4, category: "lending" },
  { id: "scallop-usdc", protocol: "Scallop", asset: "USDC", type: "Lending", apy: 11.70, tvl: 124800000, risk: "low", depositUrl: "https://app.scallop.io", color: "#8B5CF6", initials: "Sc", change24h: -0.3, category: "lending" },
  { id: "suilend-usdc", protocol: "Suilend", asset: "USDC", type: "Lending", apy: 10.35, tvl: 98400000, risk: "low", depositUrl: "https://app.suilend.fi", color: "#EC4899", initials: "Sl", change24h: 0.5, category: "lending" },
  { id: "turbos-sui", protocol: "Turbos Finance", asset: "SUI", type: "Lending", apy: 9.85, tvl: 71200000, risk: "medium", depositUrl: "https://app.turbos.finance", color: "#F97316", initials: "T", change24h: 3.1, category: "lending" },
  { id: "scallop-sui", protocol: "Scallop", asset: "SUI", type: "Lending", apy: 9.12, tvl: 55700000, risk: "medium", depositUrl: "https://app.scallop.io", color: "#8B5CF6", initials: "Sc", change24h: -0.4, category: "lending" },
  { id: "suilend-usdt", protocol: "Suilend", asset: "USDT", type: "Lending", apy: 8.75, tvl: 48900000, risk: "low", depositUrl: "https://app.suilend.fi", color: "#EC4899", initials: "Sl", change24h: 0.2, category: "lending" },
  { id: "navi-sui", protocol: "Navi Protocol", asset: "SUI", type: "Lending", apy: 6.90, tvl: 310000000, risk: "low", depositUrl: "https://app.naviprotocol.io", color: "#1A4FE0", initials: "N", change24h: 0.3, category: "lending" },
]

export const SEED_DEX: YieldEntry[] = [
  { id: "cetus-sui-usdc", protocol: "Cetus LP", asset: "SUI/USDC", type: "DEX Pool", apy: 22.40, tvl: 180000000, risk: "medium", depositUrl: "https://app.cetus.zone", color: "#06B6D4", initials: "C", change24h: -1.2, category: "dex" },
  { id: "turbos-sui-usdc", protocol: "Turbos", asset: "SUI/USDC", type: "DEX Pool", apy: 19.80, tvl: 75000000, risk: "medium", depositUrl: "https://app.turbos.finance", color: "#F97316", initials: "T", change24h: 3.1, category: "dex" },
  { id: "cetus-usdc-usdt", protocol: "Cetus LP", asset: "USDC/USDT", type: "DEX Pool", apy: 8.40, tvl: 92000000, risk: "low", depositUrl: "https://app.cetus.zone", color: "#06B6D4", initials: "C", change24h: 0.2, category: "dex" },
  { id: "aftermath-sui-usdc", protocol: "Aftermath", asset: "SUI/USDC", type: "DEX Pool", apy: 16.20, tvl: 44000000, risk: "medium", depositUrl: "https://aftermath.finance", color: "#EF4444", initials: "Af", change24h: 1.4, category: "dex" },
  { id: "flowx-sui-usdc", protocol: "FlowX", asset: "SUI/USDC", type: "DEX Pool", apy: 14.50, tvl: 31000000, risk: "medium", depositUrl: "https://flowx.finance", color: "#3B82F6", initials: "Fx", change24h: -0.8, category: "dex" },
]

export const SEED_STAKING: YieldEntry[] = [
  { id: "aftermath-afsui", protocol: "Aftermath", asset: "afSUI", type: "Liquid Staking", apy: 8.10, tvl: 140000000, risk: "low", depositUrl: "https://aftermath.finance/staking", color: "#EF4444", initials: "Af", change24h: 0.1, category: "staking" },
  { id: "haedal-hasui", protocol: "Haedal", asset: "haSUI", type: "Liquid Staking", apy: 7.80, tvl: 95000000, risk: "low", depositUrl: "https://app.haedal.xyz", color: "#6366F1", initials: "H", change24h: 0.2, category: "staking" },
  { id: "volo-vsui", protocol: "Volo", asset: "vSUI", type: "Liquid Staking", apy: 7.40, tvl: 62000000, risk: "low", depositUrl: "https://voloapp.io", color: "#10B981", initials: "V", change24h: -0.1, category: "staking" },
  { id: "sui-native", protocol: "Sui Native", asset: "SUI", type: "Staking", apy: 3.20, tvl: 8200000000, risk: "low", depositUrl: "https://suiexplorer.com", color: "#4B8BFF", initials: "S", change24h: 0.0, category: "staking" },
]

export const SEED_CEX: YieldEntry[] = [
  { id: "binance-usdc", protocol: "Binance", asset: "USDC", type: "CEX Earn", apy: 4.50, tvl: 0, risk: "low", depositUrl: "https://binance.com/en/earn", color: "#F0B90B", initials: "Bn", change24h: 0, category: "cex" },
  { id: "binance-usdt", protocol: "Binance", asset: "USDT", type: "CEX Earn", apy: 4.20, tvl: 0, risk: "low", depositUrl: "https://binance.com/en/earn", color: "#F0B90B", initials: "Bn", change24h: 0, category: "cex" },
  { id: "okx-usdc", protocol: "OKX", asset: "USDC", type: "CEX Earn", apy: 5.10, tvl: 0, risk: "low", depositUrl: "https://okx.com/earn", color: "#2563EB", initials: "OK", change24h: 0.1, category: "cex" },
  { id: "okx-usdt", protocol: "OKX", asset: "USDT", type: "CEX Earn", apy: 4.80, tvl: 0, risk: "low", depositUrl: "https://okx.com/earn", color: "#2563EB", initials: "OK", change24h: -0.1, category: "cex" },
  { id: "bybit-usdc", protocol: "Bybit", asset: "USDC", type: "CEX Earn", apy: 6.20, tvl: 0, risk: "low", depositUrl: "https://bybit.com/earn", color: "#F7A600", initials: "By", change24h: 0.3, category: "cex" },
  { id: "bybit-usdt", protocol: "Bybit", asset: "USDT", type: "CEX Earn", apy: 5.80, tvl: 0, risk: "low", depositUrl: "https://bybit.com/earn", color: "#F7A600", initials: "By", change24h: -0.2, category: "cex" },
]

export const SEED_YIELDS = [...SEED_LENDING, ...SEED_DEX, ...SEED_STAKING, ...SEED_CEX]

export const SEED_POSITIONS: Position[] = [
  { protocol: "Scallop", asset: "USDC", valueUsd: 2400, apy: 8.00, color: "#8B5CF6" },
  { protocol: "Haedal", asset: "haSUI", valueUsd: 1820, apy: 7.80, color: "#6366F1" },
  { protocol: "Aftermath", asset: "afSUI", valueUsd: 600, apy: 8.10, color: "#EF4444" },
]

export const SEED_ALERTS: AlertItem[] = [
  { id: "1", message: "USDC on any protocol > 12%", type: "increase", time: "1 hour ago", active: true, asset: "USDC" },
  { id: "2", message: "SUI staking APY > 8%", type: "increase", time: "3 hours ago", active: true, asset: "SUI" },
  { id: "3", message: "BTC yields > 5%", type: "decrease", time: "Paused", active: false, asset: "BTC" },
]

export const RATE_HISTORY = [
  { date: "Apr 26", navi: 11.8, scallop: 10.2, suilend: 8.9 },
  { date: "Apr 27", navi: 12.1, scallop: 10.8, suilend: 9.1 },
  { date: "Apr 28", navi: 11.9, scallop: 11.2, suilend: 9.4 },
  { date: "Apr 29", navi: 13.2, scallop: 11.5, suilend: 9.2 },
  { date: "Apr 30", navi: 13.8, scallop: 11.6, suilend: 9.5 },
  { date: "May 1",  navi: 14.0, scallop: 11.7, suilend: 9.6 },
  { date: "May 2",  navi: 14.2, scallop: 11.7, suilend: 9.7 },
]
