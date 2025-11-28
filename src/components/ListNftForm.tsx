"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
// import { parseEther } from "viem"
import { addDecimalsToPrice } from "@/utils/formatPrice"
import { marketplaceAbi, nftAbi, chainsToContracts } from "@/constants"
import { CgSpinner } from "react-icons/cg"
import { useRouter } from "next/navigation"

// Helper Icon
const CheckIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-500"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

export default function ListNftForm() {
    const { address } = useAccount()
    const chainId = useChainId()
    const router = useRouter()

    // Form State
    const [nftAddress, setNftAddress] = useState("")
    const [tokenId, setTokenId] = useState("")
    const [price, setPrice] = useState("")

    const [step, setStep] = useState(1) // 1: Approve, 2: List

    const marketplaceAddress =
        (chainsToContracts[chainId]?.nftMarketplace as `0x${string}`) || "0x"

    // --- Contract Writes ---

    // 1. Approve
    const {
        data: approveHash,
        isPending: isApprovePending,
        writeContract: approveNft,
        error: approveError,
    } = useWriteContract()

    // 2. List Item
    const {
        data: listHash,
        isPending: isListPending,
        writeContract: listNft,
        error: listError,
    } = useWriteContract()

    // --- Wait for Transaction ---
    const { isSuccess: isApproveSuccess, isLoading: isWaitingApprove } =
        useWaitForTransactionReceipt({ hash: approveHash })
    const { isSuccess: isListSuccess, isLoading: isWaitingList } = useWaitForTransactionReceipt({
        hash: listHash,
    })

    // 當 Approve 成功後，自動跳到第二步
    useEffect(() => {
        if (isApproveSuccess) setStep(2)
    }, [isApproveSuccess])

    // 當上架成功後，跳轉回首頁
    useEffect(() => {
        if (isListSuccess) {
            const timer = setTimeout(() => router.push("/"), 2000)
            return () => clearTimeout(timer)
        }
    }, [isListSuccess, router])

    // --- Handlers ---

    const handleApprove = () => {
        if (!nftAddress || !tokenId) return
        approveNft({
            abi: nftAbi, // 使用標準 ERC721 ABI
            address: nftAddress as `0x${string}`,
            functionName: "approve",
            args: [marketplaceAddress, BigInt(tokenId)],
        })
    }

    const handleList = () => {
        if (!nftAddress || !tokenId || !price) return
        const formattedPrice = addDecimalsToPrice(price)
        listNft({
            abi: marketplaceAbi,
            address: marketplaceAddress,
            functionName: "listItem",
            args: [nftAddress as `0x${string}`, BigInt(tokenId), formattedPrice],
        })
    }

    // --- Quick Select Logic ---
    const collections = [
        { name: "Ninja NFT", address: chainsToContracts[chainId]?.ninjaNft },
        // { name: "Cake NFT", address: chainsToContracts[chainId]?.cakeNft },
        // { name: "Mood NFT", address: chainsToContracts[chainId]?.moodNft },
    ].filter(c => c.address) // 只顯示有地址的合約

    return (
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />

            {/* Success State */}
            {isListSuccess ? (
                <div className="text-center py-12 animate-fade-in">
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Listing Created!</h2>
                    <p className="text-zinc-400">Redirecting to marketplace...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 1. Address Input with Quick Select */}
                    <div className="space-y-3">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                            NFT Contract Address
                        </label>

                        {/* Quick Select Buttons */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {collections.map(col => (
                                <button
                                    key={col.name}
                                    onClick={() => setNftAddress(col.address!)}
                                    className={`
                                        px-3 py-1 rounded-full text-xs font-medium transition-all border
                                        ${
                                            nftAddress === col.address
                                                ? "bg-purple-500/20 text-purple-300 border-purple-500"
                                                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                                        }
                                    `}
                                >
                                    {col.name}
                                </button>
                            ))}
                        </div>

                        <input
                            type="text"
                            placeholder="0x..."
                            value={nftAddress}
                            onChange={e => setNftAddress(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-mono text-sm"
                        />
                    </div>

                    {/* 2. Token ID Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                            Token ID
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={tokenId}
                            onChange={e => setTokenId(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700"
                        />
                    </div>

                    {/* 3. Price Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                            Price (USDC)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.1"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">
                                USDC
                            </div>
                        </div>
                    </div>

                    {/* Stepper / Action Buttons */}
                    <div className="pt-4 space-y-3">
                        {step === 1 && (
                            <button
                                onClick={handleApprove}
                                disabled={
                                    !nftAddress ||
                                    !tokenId ||
                                    !price ||
                                    isApprovePending ||
                                    isWaitingApprove
                                }
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex justify-center items-center gap-2"
                            >
                                {isApprovePending || isWaitingApprove ? (
                                    <>
                                        <CgSpinner className="animate-spin" size={20} />{" "}
                                        Approving...
                                    </>
                                ) : (
                                    "Step 1: Approve Marketplace"
                                )}
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={handleList}
                                disabled={
                                    !nftAddress ||
                                    !tokenId ||
                                    !price ||
                                    isListPending ||
                                    isWaitingList
                                }
                                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex justify-center items-center gap-2"
                            >
                                {isListPending || isWaitingList ? (
                                    <>
                                        <CgSpinner className="animate-spin" size={20} /> Listing...
                                    </>
                                ) : (
                                    "Step 2: Confirm Listing"
                                )}
                            </button>
                        )}

                        {/* Error Messages */}
                        {(approveError || listError) && (
                            <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
                                Error: {approveError?.message || listError?.message}
                            </div>
                        )}

                        {/* Step Indicator Text */}
                        <div className="flex justify-center gap-2 mt-2">
                            <div
                                className={`h-1.5 w-1.5 rounded-full ${step >= 1 ? "bg-purple-500" : "bg-zinc-700"}`}
                            />
                            <div
                                className={`h-1.5 w-1.5 rounded-full ${step >= 2 ? "bg-green-500" : "bg-zinc-700"}`}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
