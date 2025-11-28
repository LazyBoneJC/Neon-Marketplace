"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"

export default function ComplianceShield() {
    const { address } = useAccount()
    const [status, setStatus] = useState<"loading" | "verified" | "risk" | "idle">("idle")

    useEffect(() => {
        const checkCompliance = async () => {
            if (!address) {
                setStatus("idle")
                return
            }

            setStatus("loading")
            try {
                const response = await fetch("/api/compliance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address }),
                })
                const data = await response.json()

                if (data.isApproved) {
                    setStatus("verified")
                } else {
                    setStatus("risk")
                }
            } catch (error) {
                console.error("Compliance check failed", error)
                setStatus("idle")
            }
        }

        checkCompliance()
    }, [address])

    if (!address) return null

    // 定義不同狀態下的 Tooltip 文字
    const tooltipText =
        status === "verified"
            ? "Verified by Circle Compliance Engine"
            : status === "risk"
              ? "Flagged: High Risk Address Detected"
              : status === "loading"
                ? "Verifying with Circle API..."
                : ""

    return (
        // 1. 加入 'group' 和 'relative' 以便控制 Tooltip 定位
        <div
            className={`
            relative group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-help
            ${
                status === "verified"
                    ? "bg-green-500/10 border-green-500/50 text-green-500"
                    : status === "risk"
                      ? "bg-red-500/10 border-red-500/50 text-red-500"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
            }
        `}
        >
            {status === "loading" ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            ) : status === "verified" ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
            )}

            <span className="text-xs font-bold tracking-wide select-none">
                {status === "loading"
                    ? "CHECKING"
                    : status === "verified"
                      ? "VERIFIED"
                      : "HIGH RISK"}
            </span>

            {/* 2. Tooltip 本體 */}
            <div
                className="
                absolute top-full mt-3 left-1/2 -translate-x-1/2 
                w-max max-w-[200px] px-3 py-2 
                bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl 
                text-[10px] text-zinc-300 font-medium text-center
                opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                pointer-events-none z-50
            "
            >
                {/* 小箭頭裝飾 */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-l border-t border-zinc-700 rotate-45"></div>

                {/* 文字內容 */}
                {tooltipText}
            </div>
        </div>
    )
}
