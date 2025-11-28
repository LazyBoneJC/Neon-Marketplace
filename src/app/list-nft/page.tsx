// app/list-nft/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { chainsToContracts } from "@/constants"
import ListNftForm from "@/components/ListNftForm"
import Link from "next/link"

// 圖示組件
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
const LoaderIcon = () => (
    <svg
        className="animate-spin h-8 w-8 text-purple-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        ></circle>
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        ></path>
    </svg>
)

export default function ListNftPage() {
    const account = useAccount()
    const chainId = useChainId()
    const chainSupported =
        chainId in chainsToContracts && chainsToContracts[chainId]?.nftMarketplace !== undefined

    // Compliance State
    const [isChecking, setIsChecking] = useState(false)
    const [isComplianceChecked, setIsComplianceChecked] = useState(true)

    useEffect(() => {
        if (account.address) {
            setIsChecking(true)
            checkCompliance(account.address).then(isApproved => {
                setIsComplianceChecked(isApproved)
                setIsChecking(false)
            })
        }
    }, [account.address])

    async function checkCompliance(address: string): Promise<boolean> {
        try {
            const response = await fetch("/api/compliance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address }),
            })
            if (!response.ok) return false
            const data = await response.json()
            return data.success && data.isApproved
        } catch (error) {
            console.error("Compliance check error:", error)
            return false
        }
    }

    // --- Render States ---

    if (!account.isConnected) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-center max-w-md w-full backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                        List NFT
                    </h2>
                    <p className="text-zinc-400 mb-6">
                        Connect your wallet to list your assets on the marketplace.
                    </p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        )
    }

    if (!chainSupported) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
                <div className="p-8 bg-zinc-900 border border-red-900/30 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <ShieldAlertIcon />
                    <h2 className="text-xl font-bold text-red-500 mt-4 mb-2">Wrong Network</h2>
                    <p className="text-zinc-400 mb-6">Please switch to a supported network.</p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        )
    }

    if (isChecking) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
                <LoaderIcon />
                <p className="text-zinc-500 mt-4 animate-pulse">Verifying compliance status...</p>
            </div>
        )
    }

    if (!isComplianceChecked) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
                <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl shadow-xl text-center max-w-md w-full backdrop-blur-md">
                    <div className="flex justify-center mb-4">
                        <ShieldAlertIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Access Restricted</h2>
                    <p className="text-red-300/80 mb-6 text-sm leading-relaxed">
                        Your wallet address has been flagged. Listing features are disabled for
                        this account.
                    </p>
                    <Link href="/" className="text-zinc-400 hover:text-white underline text-sm">
                        Return Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto space-y-8">
                    <Link
                        href="/"
                        className="text-zinc-500 hover:text-purple-400 transition-colors text-sm mb-2 inline-block"
                    >
                        ← Back to Marketplace
                    </Link>
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                            List Your NFT
                        </h1>
                        <p className="text-zinc-400">
                            Set a price and put your NFT on the market.
                        </p>
                    </div>

                    {/* Form Component */}
                    <ListNftForm />
                </div>
            </main>
        </div>
    )
}
