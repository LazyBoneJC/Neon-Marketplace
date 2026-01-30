"use client"

import { useState, useCallback } from "react"

// ============== Types ==============
export interface PrecheckResult {
    addressRisk: "low" | "medium" | "high" | "unknown"
    addressMessage: string
    isContractVerified: boolean
    gasEstimate?: string
    overallStatus: "safe" | "warning" | "danger" | "checking"
}

interface UsePrecheckOptions {
    onComplete?: (result: PrecheckResult) => void
}

// ============== Hook ==============
export function useTransactionPrecheck(options: UsePrecheckOptions = {}) {
    const [isChecking, setIsChecking] = useState(false)
    const [result, setResult] = useState<PrecheckResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const checkAddress = useCallback(
        async (address: string): Promise<PrecheckResult> => {
            setIsChecking(true)
            setError(null)

            try {
                const response = await fetch("/api/compliance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address }),
                })

                const data = await response.json()

                let riskLevel: PrecheckResult["addressRisk"] = "unknown"
                let message = "無法完成風險評估"
                let overallStatus: PrecheckResult["overallStatus"] = "warning"

                if (data.success) {
                    if (data.isApproved) {
                        riskLevel = "low"
                        message = "地址風險評估通過，可安全交易"
                        overallStatus = "safe"
                    } else {
                        riskLevel = "high"
                        message = "⚠️ 偵測到高風險地址，建議謹慎操作"
                        overallStatus = "danger"
                    }
                }

                const precheckResult: PrecheckResult = {
                    addressRisk: riskLevel,
                    addressMessage: message,
                    isContractVerified: true, // Simplified - would check contract verification
                    overallStatus,
                }

                setResult(precheckResult)
                options.onComplete?.(precheckResult)

                return precheckResult
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "檢查失敗"
                setError(errorMessage)
                
                const errorResult: PrecheckResult = {
                    addressRisk: "unknown",
                    addressMessage: "無法連接風險檢查服務",
                    isContractVerified: false,
                    overallStatus: "warning",
                }
                
                setResult(errorResult)
                return errorResult
            } finally {
                setIsChecking(false)
            }
        },
        [options]
    )

    const reset = useCallback(() => {
        setResult(null)
        setError(null)
        setIsChecking(false)
    }, [])

    return {
        isChecking,
        result,
        error,
        checkAddress,
        reset,
    }
}
