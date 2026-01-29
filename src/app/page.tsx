"use client"

import dynamic from "next/dynamic"
import { useAccount } from "wagmi"
import { useEffect, useState, useCallback } from "react"
import HeroSection from "@/components/HeroSection"
import ComplianceModal from "@/components/ComplianceModal"
import PriceChart from "@/components/PriceChart"
import MarketAnalyst from "@/components/AI/MarketAnalyst"

// Lazy load heavy components
const RecentlyListedNFTs = dynamic(
    () => import("@/components/RecentlyListed"),
    {
        loading: () => (
            <div className="w-full h-64 bg-zinc-800/50 rounded-2xl motion-safe:animate-pulse flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
        ),
        ssr: false,
    }
)

export default function Home() {
    const { isConnected, address } = useAccount()
    const [isChecking, setIsChecking] = useState(false)
    const [isComplianceChecked, setIsComplianceChecked] = useState(true)

    const checkCompliance = useCallback(
        async (walletAddress: string): Promise<boolean> => {
            try {
                const response = await fetch("/api/compliance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: walletAddress }),
                })

                if (!response.ok) {
                    throw new Error("Compliance check failed")
                }

                const data = await response.json()
                return data.success && data.isApproved
            } catch (error) {
                console.error("Compliance check error:", error)
                return false
            }
        },
        []
    )

    useEffect(() => {
        if (address) {
            setIsChecking(true)
            checkCompliance(address).then((isApproved) => {
                setIsComplianceChecked(isApproved)
                setIsChecking(false)
            })
        } else {
            // Reset compliance state when wallet disconnects
            setIsComplianceChecked(true)
        }
    }, [address, checkCompliance])

    return (
        <main className="flex min-h-screen flex-col items-center bg-zinc-900 text-white">
            {/* Compliance Modal (blur overlay for restricted wallets) */}
            {isConnected && !isChecking && !isComplianceChecked && (
                <ComplianceModal />
            )}

            {/* Hero Section - Always visible */}
            <HeroSection />

            {/* Main Content - Always visible */}
            <div className="w-full max-w-7xl px-4 py-8 md:py-12 flex flex-col gap-16">
                {/* Market Analytics Section */}
                <section className="space-y-6 w-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                            Market Analytics
                        </h2>
                        <div className="text-sm text-gray-500">Live Data Updates</div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Charts and AI Analyst */}
                        <div className="lg:col-span-2 space-y-8">
                            <PriceChart />
                            <MarketAnalyst />
                        </div>

                        {/* Stats Sidebar */}
                        <div className="space-y-6">
                            <div className="p-6 bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                                <h4 className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                                    Total Volume
                                </h4>
                                <p className="text-3xl font-bold text-white mt-2">
                                    1,234 ETH
                                </p>
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

                {/* NFT List Section - Lazy Loaded */}
                <section id="nft-list" className="w-full">
                    <RecentlyListedNFTs />
                </section>
            </div>
        </main>
    )
}
