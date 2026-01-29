"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaGithub } from "react-icons/fa"
import Image from "next/image"
import Link from "next/link"
import ComplianceShield from "./ComplianceShield"
import RindexerStatus from "./RindexerStatus"
import { usePathname } from "next/navigation"

export default function Header() {
    const pathname = usePathname()
    const isActive = (path: string) => pathname === path

    return (
        <header className="sticky top-0 z-50 w-full bg-[#202020]/90 backdrop-blur-md border-b border-white/10">
            {/* Main Navigation Row */}
            <nav className="px-4 md:px-8 py-3 flex justify-between items-center">
                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <Image
                            className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                            src="/neon.png"
                            alt="Neon Logo"
                            width={32}
                            height={32}
                        />
                    </div>
                    <h1 className="text-xl font-bold hidden sm:block font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 tracking-tighter">
                        Neon Marketplace
                    </h1>
                </Link>

                {/* Right: Core CTAs */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* GitHub - Icon only */}
                    <a
                        href="https://github.com/lazybonejc/neon-marketplace"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                        aria-label="GitHub Repository"
                    >
                        <FaGithub className="h-4 w-4" />
                    </a>

                    {/* Mint Ninja */}
                    <Link
                        href="/ninja-nft"
                        className={`
                            flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold font-mono text-sm transition-all
                            ${
                                isActive("/ninja-nft")
                                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                                    : "bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 hover:border-purple-500/50 hover:text-purple-400"
                            }
                        `}
                    >
                        <span>🥷</span>
                        <span className="hidden sm:inline">Mint</span>
                    </Link>

                    {/* Connect Wallet */}
                    <ConnectButton
                        showBalance={false}
                        chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
                        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                    />
                </div>
            </nav>

            {/* Status Bar Row */}
            <div className="px-4 md:px-8 py-1.5 flex items-center justify-between border-t border-white/5 bg-zinc-900/50 text-xs">
                {/* Left: Status Indicators */}
                <div className="flex items-center gap-4 text-zinc-500">
                    <RindexerStatus />
                    <div className="hidden sm:block">
                        <ComplianceShield />
                    </div>
                </div>

                {/* Right: Slogan */}
                <span className="hidden md:block italic text-zinc-600">
                    Non-custodial • Permissionless
                </span>
            </div>
        </header>
    )
}
