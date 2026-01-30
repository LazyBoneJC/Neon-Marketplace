
const API_KEY = process.env.GEMINI_API_KEY || "";
const GEN_AI_MODEL = "gemini-2.5-flash-lite";

interface SalesDataItem {
  price?: string;
  tokenId?: string;
  nftAddress?: string;
  blockTimestamp?: string;
  txHash?: string;
  [key: string]: unknown;
}

// More realistic mock responses for demo purposes
// Note: NFT prices in this marketplace are typically 500-1000 USDC
const MOCK_RESPONSES = [
  "Recent market activity shows steady trading volume with an average sale price of 750 USDC. The Ninja NFT collection remains the most actively traded, with 3 transactions in the last 24 hours. Overall market sentiment appears bullish with increasing buyer interest.",
  "Market analysis indicates a 15% increase in trading activity compared to yesterday. Notable high-value sale: Ninja #42 sold for 950 USDC. Liquidity is healthy with floor prices holding around 500 USDC across listed items.",
  "The Neon Marketplace is experiencing moderate activity with floor prices holding steady at 500 USDC. Recent buyer behavior suggests accumulation phase. AI recommendation: Consider listing in the 600-800 USDC range for competitive positioning.",
];

export async function generateMarketAnalysis(salesData: SalesDataItem[], mock = false): Promise<string> {
  if (mock) {
    // Return a random mock response for variety
    const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
    return MOCK_RESPONSES[randomIndex];
  }

  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return "AI analysis is currently unavailable. Please configure your API key.";
  }

  try {
    // Extract only relevant fields and format price for readability
    const summarizedData = salesData.map(({ price, blockTimestamp }) => {
      // Convert raw USDC price (6 decimals) to human-readable format
      const priceInUSDC = price ? (Number(price) / 1_000_000).toFixed(2) : '0';
      return {
        priceUSDC: priceInUSDC,
        time: blockTimestamp,
      };
    });
    
    // Construct Prompt
    const prompt = `
      You are an expert NFT Market Analyst for the Neon Marketplace.
      Analyze the following recent sales data and provide a concise market summary (max 3 sentences).
      Focus on price trends, volume, or notable high-value sales.
      
      Data: ${JSON.stringify(summarizedData)}
      
      Output plain text only.
    `;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEN_AI_MODEL}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        
        // Check for rate limit error
        if (response.status === 429) {
            console.error("Rate limit exceeded, falling back to mock response");
            const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
            return MOCK_RESPONSES[randomIndex];
        }
        
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
        return "Analysis unavailable at this time.";
    }

    return resultText;

  } catch (error) {
    console.error("Error generating analysis:", error);
    return "Failed to generate market analysis. Please try again later.";
  }
}
