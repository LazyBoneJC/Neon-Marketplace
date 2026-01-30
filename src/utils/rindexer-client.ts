/**
 * Rindexer GraphQL Client
 * Provides typed queries for marketplace data
 */

// ============== Types ==============
export interface SaleRecord {
    price: string
    tokenId: string
    nftAddress: string
    blockTimestamp: string
    txHash: string
}

export interface ListingRecord {
    price: string
    tokenId: string
    nftAddress: string
    seller: string
    blockTimestamp: string
}

export interface MarketStats {
    totalVolume24h: number
    avgPrice: number
    floorPrice: number
    totalSales: number
    recentSales: SaleRecord[]
}

// ============== GraphQL Queries ==============
const RECENT_SALES_QUERY = `
  query GetRecentSales($first: Int!) {
    allItemBoughts(first: $first, orderBy: BLOCK_TIMESTAMP_DESC) {
      nodes {
        price
        tokenId
        nftAddress
        blockTimestamp
        txHash
      }
    }
  }
`

const RECENT_LISTINGS_QUERY = `
  query GetRecentListings($first: Int!) {
    allItemListeds(first: $first, orderBy: BLOCK_TIMESTAMP_DESC) {
      nodes {
        price
        tokenId
        nftAddress
        seller
        blockTimestamp
      }
    }
  }
`

// ============== Client Configuration ==============
function getGraphQLEndpoint(): string {
    const envUrl =
        process.env.RINDEXER_URL ||
        process.env.NEXT_PUBLIC_RINDEXER_URL ||
        "http://127.0.0.1:3001/graphql"

    if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
        return envUrl
    }

    const baseUrl =
        process.env.APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        "http://127.0.0.1:3001"

    return `${baseUrl}${envUrl}`
}

// ============== Query Functions ==============

/**
 * Execute a GraphQL query against the Rindexer
 */
async function executeQuery<T>(
    query: string,
    variables: Record<string, unknown> = {}
): Promise<T | null> {
    try {
        const endpoint = getGraphQLEndpoint()
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
        })

        if (!response.ok) {
            console.error("Rindexer query failed:", await response.text())
            return null
        }

        const result = await response.json()
        return result.data as T
    } catch (error) {
        console.error("Rindexer connection error:", error)
        return null
    }
}

/**
 * Get recent sales data
 */
export async function getRecentSales(limit: number = 10): Promise<SaleRecord[]> {
    const data = await executeQuery<{
        allItemBoughts: { nodes: SaleRecord[] }
    }>(RECENT_SALES_QUERY, { first: limit })

    return data?.allItemBoughts?.nodes || []
}

/**
 * Get recent listings
 */
export async function getRecentListings(limit: number = 10): Promise<ListingRecord[]> {
    const data = await executeQuery<{
        allItemListeds: { nodes: ListingRecord[] }
    }>(RECENT_LISTINGS_QUERY, { first: limit })

    return data?.allItemListeds?.nodes || []
}

/**
 * Calculate market statistics from sales data
 */
export async function getMarketStats(): Promise<MarketStats | null> {
    const sales = await getRecentSales(20)

    if (sales.length === 0) {
        return null
    }

    // Convert prices from raw USDC (6 decimals) to human readable
    const pricesUSDC = sales.map((s) => Number(s.price) / 1_000_000)

    // Calculate 24h sales (approximate by taking recent ones)
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const sales24h = sales.filter((s) => {
        const timestamp = Number(s.blockTimestamp) * 1000
        return timestamp > oneDayAgo
    })

    const volume24h = sales24h.reduce((sum, s) => sum + Number(s.price) / 1_000_000, 0)
    const avgPrice = pricesUSDC.reduce((a, b) => a + b, 0) / pricesUSDC.length
    const floorPrice = Math.min(...pricesUSDC)

    return {
        totalVolume24h: Math.round(volume24h * 100) / 100,
        avgPrice: Math.round(avgPrice * 100) / 100,
        floorPrice: Math.round(floorPrice * 100) / 100,
        totalSales: sales24h.length,
        recentSales: sales.slice(0, 5),
    }
}

/**
 * Format market stats for AI response
 */
export function formatMarketStatsForAI(stats: MarketStats): string {
    return `
市場數據分析：
• 24小時交易量：${stats.totalVolume24h} USDC
• 平均成交價：${stats.avgPrice} USDC
• 地板價：${stats.floorPrice} USDC
• 24小時成交筆數：${stats.totalSales} 筆

近期成交記錄：
${stats.recentSales
    .map((s, i) => {
        const price = (Number(s.price) / 1_000_000).toFixed(2)
        return `${i + 1}. Token #${s.tokenId} - ${price} USDC`
    })
    .join("\n")}
    `.trim()
}

// ============== Mock Data for Development ==============
export function getMockMarketStats(): MarketStats {
    return {
        totalVolume24h: 3200,
        avgPrice: 720,
        floorPrice: 500,
        totalSales: 5,
        recentSales: [
            {
                price: "950000000",
                tokenId: "42",
                nftAddress: "0x1234...5678",
                blockTimestamp: String(Math.floor(Date.now() / 1000) - 3600),
                txHash: "0xabc...def",
            },
            {
                price: "750000000",
                tokenId: "15",
                nftAddress: "0x1234...5678",
                blockTimestamp: String(Math.floor(Date.now() / 1000) - 7200),
                txHash: "0xdef...123",
            },
            {
                price: "680000000",
                tokenId: "8",
                nftAddress: "0x1234...5678",
                blockTimestamp: String(Math.floor(Date.now() / 1000) - 14400),
                txHash: "0x456...789",
            },
        ],
    }
}
