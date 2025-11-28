"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    useAccount,
    useChainId,
    useWriteContract,
    useReadContract,
    useWaitForTransactionReceipt,
} from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { chainsToContracts, erc20Abi, marketplaceAbi } from "@/constants"
import NFTBox from "@/components/NFTBox"
import Link from "next/link"

// 簡單的圖示組件
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

export default function BuyNftPage() {
    const router = useRouter()
    const { contractAddress, tokenId } = useParams() as {
        contractAddress: string
        tokenId: string
    }
    const { address, isConnected } = useAccount()
    const chainId = useChainId()

    // --- State Management ---
    const [step, setStep] = useState(1) // 1: Approve, 2: Purchase, 3: Success
    const [isCheckingCompliance, setIsCheckingCompliance] = useState(false)
    const [isComplianceApproved, setIsComplianceApproved] = useState(true)

    // --- Contract Addresses ---
    const marketplaceAddress =
        (chainsToContracts[chainId]?.nftMarketplace as `0x${string}`) || "0x"
    const usdcAddress = (chainsToContracts[chainId]?.usdc as `0x${string}`) || "0x"
    const chainSupported =
        chainId in chainsToContracts && chainsToContracts[chainId]?.nftMarketplace !== undefined

    // --- Compliance Check Logic ---
    useEffect(() => {
        if (address) {
            setIsCheckingCompliance(true)
            checkCompliance(address).then(approved => {
                setIsComplianceApproved(approved)
                setIsCheckingCompliance(false)
            })
        }
    }, [address])

    async function checkCompliance(walletAddress: string): Promise<boolean> {
        try {
            const response = await fetch("/api/compliance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: walletAddress }),
            })
            if (!response.ok) return false
            const data = await response.json()
            return data.success && data.isApproved
        } catch (error) {
            console.error("Compliance check error:", error)
            return false
        }
    }

    // --- Fetch Listing Data ---
    interface Listing {
        price: bigint
        seller: string
    }
    const { data: listingData, isLoading: isListingLoading } = useReadContract({
        abi: marketplaceAbi,
        address: marketplaceAddress,
        functionName: "getListing",
        args: [contractAddress as `0x${string}`, BigInt(tokenId)],
    })

    const listing = listingData as Listing | undefined
    const price = listing ? listing.price.toString() : "0"
    const seller = listing ? listing.seller : undefined
    const isListed = price && BigInt(price) > BigInt(0)
    const isSeller = seller === address

    // --- Write Contracts ---
    const {
        data: approvalHash,
        isPending: isApprovalPending,
        writeContract: approveToken,
        error: approvalError,
    } = useWriteContract()

    const {
        data: purchaseHash,
        isPending: isPurchasePending,
        writeContract: buyNft,
        error: purchaseError,
    } = useWriteContract()

    // --- Transaction Receipts ---
    const { isSuccess: isApprovalSuccess, isLoading: isWaitingApproval } =
        useWaitForTransactionReceipt({
            hash: approvalHash,
        })

    const { isSuccess: isPurchaseSuccess, isLoading: isWaitingPurchase } =
        useWaitForTransactionReceipt({
            hash: purchaseHash,
        })

    // --- Effects for Steps ---
    useEffect(() => {
        if (isApprovalSuccess) setStep(2)
    }, [isApprovalSuccess])

    useEffect(() => {
        if (isPurchaseSuccess) {
            setStep(3)
            const timer = setTimeout(() => router.push("/"), 5000)
            return () => clearTimeout(timer)
        }
    }, [isPurchaseSuccess, router])

    // --- Handlers ---
    const handleApprove = async () => {
        if (!price) return
        try {
            approveToken({
                abi: erc20Abi,
                address: usdcAddress,
                functionName: "approve",
                args: [marketplaceAddress, BigInt(price)],
            })
        } catch (error) {
            console.error("Error approving token:", error)
        }
    }

    const handleBuy = async () => {
        try {
            buyNft({
                abi: marketplaceAbi,
                address: marketplaceAddress,
                functionName: "buyItem",
                args: [contractAddress as `0x${string}`, BigInt(tokenId)],
            })
        } catch (error) {
            console.error("Error buying NFT:", error)
        }
    }

    // 格式化地址顯示
    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

    // --- Render Helpers ---
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-center max-w-md w-full backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                        Connect Wallet
                    </h2>
                    <p className="text-zinc-400 mb-6">
                        Please connect your wallet to purchase this NFT.
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
                    <p className="text-zinc-400 mb-6">
                        Please switch to a supported network to continue.
                    </p>
                    <div className="flex justify-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        )
    }

    if (isCheckingCompliance || isListingLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
                <LoaderIcon />
                <p className="text-zinc-500 mt-4 animate-pulse">
                    {isCheckingCompliance ? "Verifying compliance..." : "Loading NFT details..."}
                </p>
            </div>
        )
    }

    if (!isComplianceApproved) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
                <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl shadow-xl text-center max-w-md w-full backdrop-blur-md">
                    <div className="flex justify-center mb-4">
                        <ShieldAlertIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Access Restricted</h2>
                    <p className="text-red-300/80 mb-6 text-sm leading-relaxed">
                        Your wallet address has been flagged by our compliance protocols. Buying
                        features are disabled for this account.
                    </p>
                    <Link href="/" className="text-zinc-400 hover:text-white underline text-sm">
                        Return Home
                    </Link>
                </div>
            </div>
        )
    }

    if (!isListed) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center max-w-md w-full">
                    <h2 className="text-xl font-bold text-zinc-300 mb-2">Not Listed</h2>
                    <p className="text-zinc-500 mb-6">This NFT is not currently for sale.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        Browse Marketplace
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col text-white">
            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/"
                            className="text-zinc-500 hover:text-purple-400 transition-colors text-sm mb-2 inline-block"
                        >
                            ← Back to Marketplace
                        </Link>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                            Checkout
                        </h1>
                    </div>

                    {isSeller ? (
                        <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3 text-orange-400 mb-8">
                            <span>⚠️</span>
                            <span>
                                You are the owner of this NFT. You cannot buy your own listing.
                            </span>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Left Column: NFT Preview */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 backdrop-blur-sm shadow-2xl">
                                <NFTBox
                                    tokenId={tokenId}
                                    contractAddress={contractAddress}
                                    price={price}
                                    seller={seller}
                                />
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Contract</span>
                                    <span className="text-zinc-300 font-mono bg-zinc-800 px-2 py-1 rounded">
                                        {formatAddress(contractAddress)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Token ID</span>
                                    <span className="text-zinc-300 font-mono">#{tokenId}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Seller</span>
                                    <span className="text-zinc-300 font-mono bg-zinc-800 px-2 py-1 rounded">
                                        {seller ? formatAddress(seller) : "Unknown"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Checkout Logic */}
                        <div className="lg:col-span-7">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                                {/* Background Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10" />

                                <div className="space-y-8">
                                    {/* Steps Indicator */}
                                    <div className="flex items-center space-x-4 mb-8">
                                        <div
                                            className={`flex items-center gap-2 ${step >= 1 ? "text-purple-400" : "text-zinc-600"}`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-purple-400 bg-purple-400/10" : "border-zinc-700"}`}
                                            >
                                                1
                                            </div>
                                            <span className="font-bold">Approve</span>
                                        </div>
                                        <div className="h-0.5 w-8 bg-zinc-800" />
                                        <div
                                            className={`flex items-center gap-2 ${step >= 2 ? "text-blue-400" : "text-zinc-600"}`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-blue-400 bg-blue-400/10" : "border-zinc-700"}`}
                                            >
                                                2
                                            </div>
                                            <span className="font-bold">Purchase</span>
                                        </div>
                                    </div>

                                    {/* Content based on Step */}
                                    {step === 3 ? (
                                        <div className="text-center py-8 animate-fade-in">
                                            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckIcon />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">
                                                Purchase Successful!
                                            </h2>
                                            <p className="text-zinc-400">
                                                Redirecting you to home...
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end pb-4 border-b border-zinc-800">
                                                    <span className="text-zinc-400">
                                                        Total Price
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="text-3xl font-bold text-white block">
                                                            {price
                                                                ? (Number(price) / 1e6).toFixed(2)
                                                                : "0"}{" "}
                                                            USDC
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4">
                                                {/* Step 1: Approve Button */}
                                                {step === 1 && (
                                                    <button
                                                        onClick={handleApprove}
                                                        disabled={
                                                            isApprovalPending ||
                                                            isWaitingApproval ||
                                                            isSeller
                                                        }
                                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                                                    >
                                                        {isApprovalPending || isWaitingApproval ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <LoaderIcon /> Approving...
                                                            </span>
                                                        ) : (
                                                            "Approve USDC Usage"
                                                        )}
                                                    </button>
                                                )}

                                                {/* Step 2: Buy Button */}
                                                {step === 2 && (
                                                    <button
                                                        onClick={handleBuy}
                                                        disabled={
                                                            isPurchasePending ||
                                                            isWaitingPurchase ||
                                                            isSeller
                                                        }
                                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                                                    >
                                                        {isPurchasePending || isWaitingPurchase ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <LoaderIcon /> Processing
                                                                Purchase...
                                                            </span>
                                                        ) : (
                                                            "Confirm Purchase"
                                                        )}
                                                    </button>
                                                )}

                                                {/* Error Messages */}
                                                {(approvalError || purchaseError) && (
                                                    <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg text-sm mt-4">
                                                        Error:{" "}
                                                        {approvalError?.message ||
                                                            purchaseError?.message}
                                                    </div>
                                                )}

                                                {step === 1 && isWaitingApproval && (
                                                    <p className="text-center text-sm text-zinc-500 animate-pulse mt-2">
                                                        Waiting for approval transaction...
                                                    </p>
                                                )}
                                                {step === 2 && isWaitingPurchase && (
                                                    <p className="text-center text-sm text-zinc-500 animate-pulse mt-2">
                                                        Confirming purchase on-chain...
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
