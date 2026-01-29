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
        <nav className="sticky top-0 z-50 w-full px-4 md:px-8 py-3 border-b border-white/10 flex justify-between items-center bg-[#202020]/90 backdrop-blur-md">
            {/* Left: Logo + System Status */}
            <div className="flex items-center gap-3">
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

                {/* Rindexer Status - Subtle indicator */}
                <div className="hidden md:block">
                    <RindexerStatus />
                </div>
            </div>

            {/* Right: Actions + Wallet + Compliance */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* GitHub */}
                <a
                    href="https://github.com/lazybonejc/neon-marketplace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all hidden md:block"
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

                {/* Wallet Connect + Compliance Shield together */}
                <div className="flex items-center gap-2">
                    <ConnectButton
                        showBalance={false}
                        chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
                        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                    />
                    {/* Compliance Shield - Right next to wallet */}
                    <ComplianceShield />
                </div>
            </div>
        </nav>
    )
}
