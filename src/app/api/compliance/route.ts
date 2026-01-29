import { v4 as uuidv4 } from "uuid"

// 定義統一的回傳介面 (這就是你的 Protocol)
interface ApiResponse<T = unknown> {
    success: boolean
    message?: string
    isApproved?: boolean
    data?: T
}

export async function POST(request: Request) {
    try {
        const { address } = await request.json()

        // 1. 驗證失敗：統一回傳 success: false
        if (!address) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Address is required",
                } as ApiResponse),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        // 2. 處理功能關閉的情況 (Mocking)
        const enableComplianceCheck = process.env.ENABLE_COMPLIANCE_CHECK === "true"
        if (!enableComplianceCheck) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Compliance check is disabled (Dev Mode)",
                    isApproved: true, // 幫前端算好結果
                    data: { result: "SKIPPED" },
                } as ApiResponse),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        const apiKey = process.env.CIRCLE_API_KEY
        if (!apiKey) {
            return new Response(
                JSON.stringify({ success: false, message: "Server config error" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            )
        }

        const idempotencyKey = uuidv4()

        // 呼叫外部 API
        const circleResponse = await fetch(
            "https://api.circle.com/v1/w3s/compliance/screening/addresses",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    idempotencyKey,
                    address,
                    chain: "ETH-SEPOLIA",
                }),
            }
        )

        const data = await circleResponse.json()

        // 3. 處理外部 API 錯誤
        if (!circleResponse.ok) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: data.message || "Circle API Error",
                    data: data, // 把原始錯誤留著以備除錯
                } as ApiResponse),
                {
                    status: circleResponse.status,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        // 4. 計算業務邏輯 (關鍵步驟！)
        // Circle 回傳的結構可能很深，我們在這裡幫前端判斷好
        // 假設 Circle 的成功狀態是 data.screening.result == 'APPROVED' (需依實際文件為準)
        const isApproved = data?.data?.result === "APPROVED"

        // 5. 回傳標準化結果
        return new Response(
            JSON.stringify({
                success: true,
                isApproved: isApproved, // 前端直接用這個 boolean
                data: data?.data, // 原始資料也給前端備用
            } as ApiResponse),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        )
    } catch (error) {
        console.error("Compliance error:", error)
        return new Response(
            JSON.stringify({
                success: false,
                message: "Internal Server Error",
            } as ApiResponse),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        )
    }
}
