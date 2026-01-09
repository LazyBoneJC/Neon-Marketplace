// import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const GEN_AI_MODEL = "gemini-2.5-flash-lite"; // Using 1.5 Flash as standard, user mentioned 2.5 but likely meant 1.5 or 2.0

export async function generateMarketAnalysis(salesData: any[], mock = false): Promise<string> {
  if (mock) {
    return "Mock Analysis: The market is currently seeing a steady volume of trades. Prices are hovering around 0.5 ETH with a slight upward trend in the last hour. Blue-chip collections remain dominant.";
  }

  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return "Error: AI Service not configured.";
  }

  try {
    // We can use the REST API directly to avoid dependencies if preferred, 
    // but the SDK is robust. Since we haven't installed the SDK yet, 
    // I will implement a fetch-based fallback or we can install the SDK.
    // GUIDANCE: For now I will use direct fetch to avoid forcing an npm install content.
    
    // Construct Prompt
    const prompt = `
      You are an expert NFT Market Analyst for the Neon Marketplace.
      Analyze the following recent sales data and provide a concise market summary (max 3 sentences).
      Focus on price trends, volume, or notable high-value sales.
      
      Data: ${JSON.stringify(salesData, null, 2)}
      
      Output plain text only.
    `;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEN_AI_MODEL}:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
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
    return "Failed to generate market analysis.";
  }
}
