"use client"

import { useState } from "react"
import { useTransactionPrecheck } from "@/hooks/useTransactionPrecheck"

// ============== Types ==============
interface TransactionPreviewProps {
    action: {
        type: "list_nft" | "market_data" | "risk_check"
        params: Record<string, unknown>
    }
    onConfirm: () => void
    onCancel: () => void
    onEdit?: () => void
}

// ============== Component ==============
export default function TransactionPreview({
    action,
    onConfirm,
    onCancel,
    onEdit,
}: TransactionPreviewProps) {
    const [hasPrecheck, setHasPrecheck] = useState(false)
    const { isChecking, result, checkAddress } = useTransactionPrecheck()

    // Trigger precheck when user clicks the button
    const handlePrecheck = async () => {
        // For list_nft, we'd check the marketplace contract
        // For now, simulate a check
        await checkAddress("0x0000000000000000000000000000000000000000")
        setHasPrecheck(true)
    }

    const renderActionDetails = () => {
        if (action.type === "list_nft") {
            return (
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                        <span className="text-zinc-400 text-sm">NFT</span>
                        <span className="text-white font-medium">
                            Ninja NFT #{action.params.tokenId as string}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                        <span className="text-zinc-400 text-sm">上架價格</span>
                        <span className="text-white font-medium">
                            {action.params.price as string} USDC
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-zinc-400 text-sm">平台手續費</span>
                        <span className="text-zinc-500 text-sm">0%</span>
                    </div>
                </div>
            )
        }

        return (
            <div className="text-zinc-400 text-sm">
                操作類型：{action.type}
            </div>
        )
    }

    const renderPrecheckStatus = () => {
        if (!hasPrecheck) {
            return (
                <button
                    onClick={handlePrecheck}
                    disabled={isChecking}
                    className="w-full py-2 text-sm text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                >
                    {isChecking ? "檢查中..." : "🔒 執行安全預檢"}
                </button>
            )
        }

        if (!result) return null

        const statusColors = {
            safe: "bg-green-500/10 border-green-500/30 text-green-400",
            warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
            danger: "bg-red-500/10 border-red-500/30 text-red-400",
            checking: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400",
        }

        const statusIcon = {
            safe: "✅",
            warning: "⚠️",
            danger: "🚫",
            checking: "🔄",
        }

        return (
            <div
                className={`p-3 rounded-lg border ${statusColors[result.overallStatus]}`}
            >
                <div className="flex items-start gap-2">
                    <span className="text-lg">{statusIcon[result.overallStatus]}</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium">安全檢查結果</p>
                        <p className="text-xs mt-1 opacity-80">{result.addressMessage}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-zinc-700">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <h3 className="text-white font-semibold">交易確認</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Action Details */}
                {renderActionDetails()}

                {/* Precheck Status */}
                {renderPrecheckStatus()}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 text-sm text-zinc-400 bg-zinc-700/50 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                        取消
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex-1 py-2.5 text-sm text-purple-300 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                            編輯
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        disabled={!hasPrecheck || result?.overallStatus === "danger"}
                        className="flex-1 py-2.5 text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        確認執行
                    </button>
                </div>

                {/* Warning for high risk */}
                {result?.overallStatus === "danger" && (
                    <p className="text-xs text-red-400 text-center">
                        ⚠️ 檢測到風險，已禁止執行此交易
                    </p>
                )}
            </div>
        </div>
    )
}
