"use client"

import Link from "next/link"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

export default function HeroSection() {
    const { isConnected } = useAccount()
    const { openConnectModal } = useConnectModal()

    return (
        <section className="relative w-full overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,0,255,0.15),transparent_50%)]" />

            {/* Scan Line Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
                {/* Main Hero Content */}
                <div className="text-center space-y-6 mb-12">
                    {/* Animated Title - motion-safe for accessibility */}
                    <h1 className="text-5xl md:text-7xl font-bold">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 motion-safe:animate-pulse">
                            NEON
                        </span>
                        <span className="text-white ml-4">MARKETPLACE</span>
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Discover, collect, and trade extraordinary NFTs in a
                        <span className="text-purple-400"> cyberpunk-powered </span>
                        marketplace with AI-driven insights.
                    </p>
                </div>

                {/* Feature Preview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Price Trends Card */}
                    <div className="group p-6 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl" role="img" aria-label="Chart icon">
                                📈
                            </span>
                            <h3 className="text-white font-semibold">Live Price Trends</h3>
                        </div>
                        <p className="text-gray-500 text-sm">
                            Real-time market data from on-chain transactions
                        </p>
                    </div>

                    {/* AI Analyst Card */}
                    <div className="group p-6 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl" role="img" aria-label="Robot icon">
                                🤖
                            </span>
                            <h3 className="text-white font-semibold">AI Market Analyst</h3>
                        </div>
                        <p className="text-gray-500 text-sm">
                            Gemini-powered insights updated hourly
                        </p>
                    </div>

                    {/* USDC Faucet Card */}
                    <div className="group p-6 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl" role="img" aria-label="Water droplet icon">
                                💧
                            </span>
                            <h3 className="text-white font-semibold">Testnet Faucet</h3>
                        </div>
                        <p className="text-gray-500 text-sm">
                            Get USDC to start trading instantly
                        </p>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        href="#nft-list"
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1"
                    >
                        Explore NFTs ↓
                    </Link>

                    {!isConnected && openConnectModal && (
                        <button
                            className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 hover:border-purple-500/50 transition-all duration-300"
                            onClick={openConnectModal}
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}
