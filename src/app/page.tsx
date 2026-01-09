"use client"

import { useAccount } from "wagmi"
import RecentlyListedNFTs from "@/components/RecentlyListed"
import { useEffect, useState } from "react"
import PriceChart from "@/components/PriceChart"
import MarketAnalyst from "@/components/AI/MarketAnalyst"

// 簡單的圖示組件 (可以換成 lucide-react 的圖示)
const WalletIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-purple-400"
    >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
)
const ShieldAlertIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-500"
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
)

export default function Home() {
    const { isConnected } = useAccount()
    const { address } = useAccount()
    const [isChecking, setIsChecking] = useState(false) // 增加一個 loading 狀態，避免一開始就閃現錯誤
    const [isComplianceChecked, setIsComplianceChecked] = useState(true)

    useEffect(() => {
        if (address) {
            setIsChecking(true)
            // Compliance check
            checkCompliance(address).then(isApproved => {
                if (!isApproved) {
                    // alert("Your address did not pass the compliance check.")
                    setIsComplianceChecked(false)
                } else {
                    setIsComplianceChecked(true)
                }
                setIsChecking(false)
            })
        }
    }, [address])

    async function checkCompliance(address: string): Promise<boolean> {
        try {
            const response = await fetch("/api/compliance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address }),
            })

            if (!response.ok) {
                throw new Error("Compliance check failed")
            }

            const data = await response.json()
            setIsComplianceChecked(data.success && data.isApproved)
            return data.success && data.isApproved
        } catch (error) {
            console.error("Compliance check error:", error)
            return false
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-zinc-900 text-white">
            {!isConnected ? (
                // 狀態 1: 未連接錢包 (Hero Section)
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-4">
                    <div className="p-6 bg-zinc-800/50 rounded-full border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                        <WalletIcon />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                            Neon Marketplace
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                            Discover, collect, and trade extraordinary NFTs. <br />
                            Please connect your wallet to start your journey.
                        </p>
                    </div>
                </div>
            ) : isChecking ? (
                // 狀態 2: 檢查中 (Loading)
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <p className="text-gray-400 animate-pulse">Verifying compliance status...</p>
                </div>
            ) : !isComplianceChecked ? (
                // 狀態 3: 合規檢查失敗 (Access Denied)
                <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
                    <div className="max-w-md w-full bg-red-950/20 border border-red-500/30 p-8 rounded-2xl text-center space-y-6 backdrop-blur-sm">
                        <div className="flex justify-center">
                            <div className="p-4 bg-red-500/10 rounded-full">
                                <ShieldAlertIcon />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-500 mb-2">
                                Access Restricted
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                We are sorry, but your wallet address has been flagged by our
                                compliance protocols. Trading features are currently disabled for
                                this account.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                // 狀態 4: 正常顯示內容 (Dashboard)
                <div className="w-full max-w-7xl px-4 py-8 md:py-12 flex flex-col gap-16">
                    {/* 數據儀表板區域 - 獨立區塊 */}
                    <section className="space-y-6 w-full">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                                Market Analytics
                            </h2>
                            <div className="text-sm text-gray-500">Live Data Updates</div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* 左邊放圖表，佔據 2/3 寬度 */}
                            <div className="lg:col-span-2 space-y-8">
                                <PriceChart />
                                <MarketAnalyst />
                            </div>

                            {/* 右邊放統計數據卡片 */}
                            <div className="space-y-6">
                                <div className="p-6 bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                                    <h4 className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                                        Total Volume
                                    </h4>
                                    <p className="text-3xl font-bold text-white mt-2">1,234 ETH</p>
                                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                        <span>+12.5%</span>
                                        <span className="text-gray-500">past 24h</span>
                                    </div>
                                </div>

                                <div className="p-6 bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all duration-300">
                                    <h4 className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                                        Unique Holders
                                    </h4>
                                    <p className="text-3xl font-bold text-white mt-2">892</p>
                                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                        <span>+5.3%</span>
                                        <span className="text-gray-500">new joiners</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* NFT Lists - 獨立區塊 */}
                    <section className="w-full">
                        <RecentlyListedNFTs />
                    </section>
                </div>
            )}
        </main>
    )
}
