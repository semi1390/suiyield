import { NextResponse } from 'next/server'

export async function GET() {
  const navi = await import('@naviprotocol/lending')
  
  // Check IncentiveAPYInfo — this should have boosted rates per pool
  const incentive = (navi as any).IncentiveAPYInfo
  
  // Also check IncentivePoolInfo
  const poolInfo = (navi as any).IncentivePoolInfo
  
  // Also try calling getPool on DEEP with full data
  const { getPool } = navi
  const deepPool = await getPool('0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP') as any

  return NextResponse.json({
    incentiveAPYInfo: {
      type: typeof incentive,
      isArray: Array.isArray(incentive),
      value: incentive,
    },
    incentivePoolInfo: {
      type: typeof poolInfo,
      value: poolInfo,
    },
    deepPoolAllKeys: deepPool ? Object.keys(deepPool) : [],
    deepPoolFull: deepPool,
  })
}