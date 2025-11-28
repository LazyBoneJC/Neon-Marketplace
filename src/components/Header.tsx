"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaGithub } from "react-icons/fa"
import Image from "next/image"
import Link from "next/link" // 1. 引入 Link
import ComplianceShield from "./ComplianceShield"
import RindexerStatus from "./RindexerStatus"
import { usePathname } from "next/navigation"

export default function Header() {
    const pathname = usePathname()

    // 判斷連結是否活躍，用來做高亮效果
    const isActive = (path: string) => pathname === path

    return (
        <nav
            // 2. 改用 Tailwind 類別，加入 sticky 和 backdrop-blur (毛玻璃)
            className="sticky top-0 z-50 w-full px-8 py-4 border-b border-white/10 flex flex-row justify-between items-center xl:min-h-[77px] bg-[#202020]/90 backdrop-blur-md transition-all duration-300"
        >
            {/* Left Side: Logo & Slogan */}
            <div className="flex items-center gap-2.5 md:gap-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <Image
                            // 加入 group-hover 發光效果
                            className="image-glow transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                            src="/neon.png"
                            alt="Neon Logo"
                            width={36}
                            height={36}
                        />
                    </div>
                    <h1 className="text-2xl font-bold hidden md:block font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 tracking-tighter">
                        Neon Marketplace
                    </h1>
                </Link>

                {/* Slogan - 手機版隱藏，增加一點字體顏色對比 */}
                <h3 className="italic text-left hidden xl:block text-zinc-400 text-sm border-l border-zinc-700 pl-4 ml-2">
                    Non-custodial, permissionless
                </h3>

                {/* Rindexer Status */}
                <div className="hidden lg:flex ml-2 items-center">
                    <RindexerStatus />
                </div>
            </div>

            {/* Right Side: Navigation & Actions */}
            <div className="flex items-center gap-4">
                {/* Compliance Shield */}
                <div className="hidden sm:block">
                    <ComplianceShield />
                </div>

                {/* GitHub Link */}
                <a
                    href="https://github.com/lazybonejc/neon-marketplace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-neon p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white/30 transition-all hidden md:block"
                    aria-label="GitHub Repository"
                >
                    <FaGithub className="h-5 w-5" />
                </a>

                {/* Ninja NFT Link - 優化按鈕樣式 */}
                <Link
                    href="/ninja-nft"
                    className={`
                        button-neon relative flex items-center justify-center px-4 py-2 rounded-xl font-bold font-mono text-sm transition-all duration-300
                        ${
                            isActive("/ninja-nft")
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-purple-500/50 hover:text-purple-400"
                        }
                    `}
                >
                    <span className="mr-2">🥷</span>
                    <span>Mint Ninja</span>
                </Link>

                {/* Wallet Connect */}
                <ConnectButton
                    showBalance={false}
                    chainStatus={{
                        smallScreen: "icon", // 手機版只顯示圖示
                        largeScreen: "full", // 電腦版顯示 "Sepolia" + 圖示
                    }}
                    accountStatus={{
                        smallScreen: "avatar",
                        largeScreen: "full",
                    }}
                />
            </div>
        </nav>
    )
}
