import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { positions, rates, walletTokens } = await req.json()

    const systemPrompt = `You are an expert DeFi yield advisor for the Sui blockchain. 
You analyze a user's portfolio and provide actionable insights.
You must respond with ONLY valid JSON — no markdown, no explanation, just the JSON object.
Be specific with numbers. Be honest about risks. Keep each insight brief (max 2 sentences).`

    const userPrompt = `Analyze this Sui DeFi portfolio and return insights as JSON:

CURRENT POSITIONS (what they have deposited):
${JSON.stringify(positions, null, 2)}

ALL AVAILABLE RATES (live rates from protocols):
${JSON.stringify(rates?.slice(0, 30), null, 2)}

WALLET TOKENS (undeployed capital sitting idle):
${JSON.stringify(walletTokens, null, 2)}

Return a JSON object in exactly this format:
{
  "summary": "One sentence portfolio summary",
  "score": 75,
  "scoreLabel": "Good",
  "insights": [
    {
      "type": "opportunity",
      "title": "Short title",
      "body": "Explanation with specific numbers",
      "metric": "+$X/year or X% more",
      "urgency": "high"
    }
  ]
}

Rules:
- type must be one of: "opportunity", "risk", "signal"
- urgency must be one of: "high", "medium", "low"  
- Include 2-4 insights total
- score is 0-100 (how well optimized the portfolio is)
- scoreLabel is "Poor", "Fair", "Good", or "Excellent"
- If no positions exist, focus on wallet tokens and suggest first deposit
- Only suggest moves that are genuinely better (>1% APY improvement)
- Be specific: name the protocols and exact APY numbers`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("[ai-analysis] Claude error:", err)
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ""

    console.log("[ai-analysis] Claude response:", text.slice(0, 300))

    // Parse JSON from response
    const clean = text.replace(/```json|```/g, "").trim()
    const analysis = JSON.parse(clean)

    return NextResponse.json({ analysis })
  } catch (err: any) {
    console.error("[ai-analysis] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}