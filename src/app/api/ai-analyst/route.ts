import { NextResponse } from 'next/server';
import { generateMarketAnalysis } from '@/utils/ai-service';

// Revalidate this route every hour to save costs/tokens (Caching)
export const revalidate = 3600; 

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_RINDEXER_URL || 'http://localhost:3001/graphql';

const RECENT_SALES_QUERY = `
  query GetRecentSales {
    allItemBoughts(first: 10, orderBy: BLOCK_TIMESTAMP_DESC) {
      nodes {
        price
        tokenId
        nftAddress
        blockTimestamp
        txHash
      }
    }
  }
`;

export async function GET() {
  try {
    // 1. Check Mock Mode
    const isMock = process.env.MOCK_AI === 'true';
    if (isMock) {
        const analysis = await generateMarketAnalysis([], true);
        return NextResponse.json({ 
            analysis, 
            timestamp: new Date().toISOString(),
            isMock: true 
        });
    }

    // 2. Fetch Data from Rindexer
    let salesData = [];
    try {
        const rindexerRes = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: RECENT_SALES_QUERY }),
            next: { revalidate: 60 } // Cache data fetch for 1 min, but API route is 1h
        });
        
        if (!rindexerRes.ok) {
            console.error("Rindexer fetch failed:", await rindexerRes.text());
        } else {
            const json = await rindexerRes.json();
            salesData = json.data?.allItemBoughts?.nodes || [];
        }
    } catch (e) {
        console.error("Failed to connect to Rindexer:", e);
        // Fallback to empty data (AI will just see empty array, maybe handle gracefully?)
    }

    // 3. Generate Analysis
    // If no sales data, we might want to skip AI or give a generic message
    if (salesData.length === 0) {
        return NextResponse.json({ 
            analysis: "No recent market activity detected to analyze.", 
            timestamp: new Date().toISOString() 
        });
    }

    const analysis = await generateMarketAnalysis(salesData, false);

    return NextResponse.json({
        analysis,
        timestamp: new Date().toISOString(),
        source: 'Gemini'
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
