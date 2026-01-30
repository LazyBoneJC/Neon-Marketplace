import { NextResponse } from "next/server"
import {
    getMarketStats,
    getMockMarketStats,
    formatMarketStatsForAI,
} from "@/utils/rindexer-client"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// ============== Types ==============
interface ChatRequest {
    message: string
    history?: { role: string; content: string }[]
    userContext?: {
        address?: string
        chainId?: number
    }
}

interface FunctionCallResult {
    type: "list_nft" | "market_data" | "risk_check"
    params: Record<string, unknown>
    status: "pending" | "confirmed" | "cancelled"
}

// ============== Constants ==============
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
const GEN_AI_MODEL = "gemini-2.5-flash-lite"
const IS_MOCK_MODE = process.env.MOCK_AI === "true"

// System prompt for the AI assistant (bilingual - responds in user's language)
const SYSTEM_PROMPT = `You are Neon Assistant, an AI helper for Neon Marketplace - a Web3 platform designed for NFT trading.

**CRITICAL LANGUAGE RULE**: 
- If the user writes in Chinese (Traditional or Simplified), respond in Traditional Chinese (繁體中文).
- If the user writes in English or any other language, respond in English.
- Always match the language of the user's message.

Your capabilities:
1. Help users list NFTs (requires NFT address, Token ID, price)
2. Query market data and price trends
3. Check wallet address security risks

Important rules:
- When users want to perform an action but information is incomplete, politely ask for missing details
- Price unit is USDC, NFT prices typically range from 500-1000 USDC
- Keep responses concise and friendly
- If a request is beyond your capabilities, honestly inform the user

Available action commands (internal use, don't show to users):
- LIST_NFT: List an NFT
- QUERY_MARKET: Query market data
- CHECK_RISK: Check address risk`

// ============== Mock Responses ==============
// Bilingual mock responses (zh-TW / en)
type Language = "zh" | "en"

const MOCK_RESPONSES: Record<string, Record<Language, string[]>> = {
    greeting: {
        zh: [
            "嗨！我是 Neon 助手 🌟 有什麼我可以幫助你的嗎？你可以問我市場行情、上架 NFT、或是檢查錢包安全。",
            "Hello! 歡迎來到 Neon Marketplace。我可以幫你查詢市場數據、協助上架 NFT、或進行安全檢查。有什麼需要嗎？",
        ],
        en: [
            "Hey! I'm Neon Assistant 🌟 How can I help you today? You can ask me about market trends, list NFTs, or check wallet security.",
            "Welcome to Neon Marketplace! I can help you query market data, list NFTs, or run security checks. What would you like to do?",
        ],
    },
    market_query: {
        zh: [
            "根據最新數據，Ninja NFT 系列近 24 小時平均成交價為 **720 USDC**，地板價維持在 **500 USDC**。交易量較昨日上升 12%，市場情緒偏向看漲。",
            "目前市場概況：\n• 24h 交易量：3,200 USDC\n• 地板價：500 USDC\n• 最高成交：950 USDC (Ninja #42)\n\n建議掛單價格區間：600-800 USDC 較具競爭力。",
        ],
        en: [
            "Based on latest data, Ninja NFT collection has an average price of **720 USDC** in the past 24h, with floor price at **500 USDC**. Trading volume is up 12% from yesterday, market sentiment is bullish.",
            "Market Overview:\n• 24h Volume: 3,200 USDC\n• Floor Price: 500 USDC\n• Highest Sale: 950 USDC (Ninja #42)\n\nRecommended listing range: 600-800 USDC for competitive positioning.",
        ],
    },
    list_intent: {
        zh: [
            "好的！我來幫你上架 NFT。請告訴我：\n1. NFT 合約地址（或選擇 Ninja NFT）\n2. Token ID\n3. 期望售價（USDC）",
            "沒問題，讓我來協助你上架。需要以下資訊：\n• 你要上架哪個 NFT 系列？\n• Token ID 是多少？\n• 你想設定什麼價格？（建議參考地板價 500 USDC）",
        ],
        en: [
            "Sure! Let me help you list your NFT. Please provide:\n1. NFT contract address (or choose Ninja NFT)\n2. Token ID\n3. Desired price (USDC)",
            "No problem! To list your NFT, I'll need:\n• Which NFT collection?\n• What's the Token ID?\n• What price would you like to set? (Floor price is 500 USDC)",
        ],
    },
    list_confirm: {
        zh: [
            "收到！我將幫你準備上架：\n\n📦 **NFT**: Ninja NFT #{{tokenId}}\n💰 **價格**: {{price}} USDC\n\n請點擊下方按鈕確認，系統會引導你完成錢包簽名。",
        ],
        en: [
            "Got it! I'll prepare your listing:\n\n📦 **NFT**: Ninja NFT #{{tokenId}}\n💰 **Price**: {{price}} USDC\n\nClick the button below to confirm, and you'll be guided through wallet signing.",
        ],
    },
    risk_check: {
        zh: [
            "地址安全檢查完成 ✅\n\n該地址未被標記為高風險，可以安全進行交易。",
            "正在檢查地址風險... 請稍候。\n\n✅ 檢查結果：該地址信譽良好，無異常交易記錄。",
        ],
        en: [
            "Address security check complete ✅\n\nThis address is not flagged as high-risk. Safe to proceed with transactions.",
            "Checking address risk... Please wait.\n\n✅ Result: This address has good reputation with no suspicious activity.",
        ],
    },
    unknown: {
        zh: [
            "抱歉，我不太確定你的意思。你可以試試：\n• 「查詢市場行情」\n• 「幫我上架 NFT」\n• 「檢查這個地址安全嗎」",
            "這個問題超出我目前的能力範圍了 😅 我主要可以幫你處理 NFT 交易相關的事務。要不要試試問問市場價格？",
        ],
        en: [
            "Sorry, I'm not quite sure what you mean. You can try:\n• \"Check market trends\"\n• \"Help me list an NFT\"\n• \"Is this address safe?\"",
            "That's outside my current capabilities 😅 I mainly help with NFT trading tasks. Would you like to check market prices instead?",
        ],
    },
}

// Detect language from user message
function detectLanguage(message: string): Language {
    // Check for Chinese characters
    const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/
    if (chineseRegex.test(message)) {
        return "zh"
    }
    return "en"
}

// ============== Helper Functions ==============
function detectIntent(message: string): keyof typeof MOCK_RESPONSES {
    const lowerMsg = message.toLowerCase()

    // Greeting patterns
    if (/^(hi|hello|嗨|你好|哈囉|hey|早安|午安|晚安)/i.test(lowerMsg)) {
        return "greeting"
    }

    // List NFT patterns (check before risk_check to avoid "check" collision)
    if (
        lowerMsg.includes("上架") ||
        lowerMsg.includes("賣") ||
        lowerMsg.includes("list nft") ||
        lowerMsg.includes("list my") ||
        lowerMsg.includes("sell") ||
        lowerMsg.includes("掛賣") ||
        (lowerMsg.includes("list") && !lowerMsg.includes("price"))
    ) {
        return "list_intent"
    }

    // Market query patterns
    if (
        lowerMsg.includes("市場") ||
        lowerMsg.includes("行情") ||
        lowerMsg.includes("價格") ||
        lowerMsg.includes("成交") ||
        lowerMsg.includes("地板") ||
        lowerMsg.includes("多少錢") ||
        lowerMsg.includes("floor") ||
        lowerMsg.includes("price") ||
        lowerMsg.includes("check price") ||
        lowerMsg.includes("market")
    ) {
        return "market_query"
    }

    // Risk check patterns
    if (
        lowerMsg.includes("安全") ||
        lowerMsg.includes("風險") ||
        lowerMsg.includes("檢查") ||
        lowerMsg.includes("risk") ||
        lowerMsg.includes("security") ||
        lowerMsg.includes("safe") ||
        (lowerMsg.includes("check") && !lowerMsg.includes("price")) ||
        /0x[a-fA-F0-9]{40}/.test(message)
    ) {
        return "risk_check"
    }

    return "unknown"
}

function getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)]
}

function parseFunctionCall(message: string, _response: string): FunctionCallResult | undefined {
    const lowerMsg = message.toLowerCase()

    // Check if this looks like a list NFT with complete info
    const priceMatch = message.match(/(\d+)\s*(usdc|u|塊|元)?/i)
    const tokenIdMatch = message.match(/#?(\d+)/i)

    if (
        (lowerMsg.includes("上架") || lowerMsg.includes("list")) &&
        priceMatch &&
        tokenIdMatch
    ) {
        return {
            type: "list_nft",
            params: {
                tokenId: tokenIdMatch[1],
                price: priceMatch[1],
            },
            status: "pending",
        }
    }

    return undefined
}

// ============== Main Handler ==============
export async function POST(request: Request) {
    try {
        const { message, history, userContext: _userContext }: ChatRequest = await request.json()
        // _userContext will be used in Phase 3 for wallet-aware prompts

        if (!message?.trim()) {
            return NextResponse.json(
                { success: false, message: "Message is required" },
                { status: 400 }
            )
        }

        // ========== Mock Mode ==========
        if (IS_MOCK_MODE || !GEMINI_API_KEY) {
            const intent = detectIntent(message)
            const lang = detectLanguage(message)
            let response: string

            // Special handling for market queries - try to get real data
            if (intent === "market_query") {
                try {
                    // Try Rindexer first, fallback to mock
                    const stats = await getMarketStats()
                    if (stats && stats.totalSales > 0) {
                        response = formatMarketStatsForAI(stats)
                    } else {
                        // Use mock stats if no real data
                        const mockStats = getMockMarketStats()
                        response = formatMarketStatsForAI(mockStats)
                    }
                } catch {
                    // Fallback to predefined mock responses
                    response = getRandomResponse(MOCK_RESPONSES.market_query[lang])
                }
            } else {
                const responses = MOCK_RESPONSES[intent][lang]
                response = getRandomResponse(responses)

                // Replace template variables if needed
                const tokenIdMatch = message.match(/#?(\d+)/i)
                const priceMatch = message.match(/(\d+)\s*(usdc|u)?/i)

                if (tokenIdMatch) {
                    response = response.replace("{{tokenId}}", tokenIdMatch[1])
                }
                if (priceMatch) {
                    response = response.replace("{{price}}", priceMatch[1])
                }
            }

            // Check for function call
            const action = parseFunctionCall(message, response)

            return NextResponse.json({
                success: true,
                response,
                action,
                isMock: true,
            })
        }

        // ========== Real Gemini API ==========
        // Build conversation history for context
        const conversationHistory =
            history?.map((m) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
            })) || []

        const apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEN_AI_MODEL}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }],
                    },
                    contents: [
                        ...conversationHistory,
                        {
                            role: "user",
                            parts: [{ text: message }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    },
                }),
            }
        )

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text()
            console.error("Gemini API Error:", errorText)

            // Fallback to mock on rate limit
            if (apiResponse.status === 429) {
                console.warn("Rate limited, falling back to mock mode")
                const intent = detectIntent(message)
                const lang = detectLanguage(message)
                return NextResponse.json({
                    success: true,
                    response: getRandomResponse(MOCK_RESPONSES[intent][lang]),
                    isMock: true,
                    rateLimited: true,
                })
            }

            throw new Error(`Gemini API Error: ${apiResponse.statusText}`)
        }

        const data = await apiResponse.json()
        const responseText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "抱歉，我無法生成回應。請稍後再試。"

        // Parse for potential function calls
        const action = parseFunctionCall(message, responseText)

        return NextResponse.json({
            success: true,
            response: responseText,
            action,
        })
    } catch (error) {
        console.error("Chat API Error:", error)
        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
                response: "抱歉，發生了錯誤。請稍後再試。",
            },
            { status: 500 }
        )
    }
}
