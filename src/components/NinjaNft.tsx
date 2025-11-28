"use client"

import { useState, useMemo, useEffect } from "react"
import { RiSwordFill } from "react-icons/ri"
import { useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { ninjaAbi, chainsToContracts } from "@/constants"
import { CgSpinner } from "react-icons/cg"
import Image from "next/image"

interface NFTContractFormProps {
    contractAddress?: `0x${string}`
}

export default function NFTContractForm({ contractAddress }: NFTContractFormProps) {
    const chainId = useChainId()

    const ninjaContractAddress = useMemo(() => {
        if (contractAddress) return contractAddress
        return (chainsToContracts[chainId]?.ninjaNft as `0x${string}`) || null
    }, [chainId, contractAddress])

    const [tokenId, setTokenId] = useState("")
    const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)
    const [lastMintedTokenId, setLastMintedTokenId] = useState<string | null>(null)

    // --- Contract Interactions ---

    // 1. Mint Function
    const {
        data: mintNinjaHash,
        isPending: isMintPending,
        error: mintNinjaError,
        writeContractAsync: writeMintNinjaAsync,
    } = useWriteContract()

    const {
        isLoading: isMintConfirming,
        isSuccess: isMintConfirmed,
        data: dataFromMintReceipt,
    } = useWaitForTransactionReceipt({
        confirmations: 1,
        hash: mintNinjaHash,
    })

    // 2. Read Token URI
    const {
        data: tokenURIData,
        isLoading: isTokenURILoading,
        error: tokenURIError,
    } = useReadContract({
        abi: ninjaAbi,
        address: ninjaContractAddress as `0x${string}`,
        functionName: "tokenURI",
        args: [tokenId ? BigInt(tokenId) : undefined],
        query: {
            enabled: !!tokenId,
        },
    })

    // --- Handlers ---

    async function handleMintNinja() {
        try {
            await writeMintNinjaAsync({
                abi: ninjaAbi,
                address: ninjaContractAddress as `0x${string}`,
                functionName: "mintNinja",
                args: [],
            })
        } catch (error) {
            console.error("Error minting ninja:", error)
        }
    }

    // --- Effects ---

    // 1. Parse Metadata (關鍵：處理 On-chain Base64)
    useEffect(() => {
        if (tokenURIData) {
            try {
                const uri = tokenURIData as string

                // 檢查是否為 Base64 Data URI
                if (uri.startsWith("data:application/json;base64,")) {
                    const base64Json = uri.replace("data:application/json;base64,", "")
                    const jsonString = atob(base64Json)
                    const metadata = JSON.parse(jsonString)
                    setNftImageUrl(metadata.image)
                } else {
                    // Fallback for http/ipfs
                    fetch(uri)
                        .then(res => res.json())
                        .then(data => setNftImageUrl(data.image))
                }
            } catch (error) {
                console.error("Error parsing metadata:", error)
            }
        }
    }, [tokenURIData])

    // 2. Capture Minted ID from Logs
    useEffect(() => {
        if (isMintConfirmed && dataFromMintReceipt) {
            // ERC721 Transfer event topic[3] is tokenId (indexed)
            // Logs structure depends on the contract, usually Transfer is the last one or close to it
            // For safety, let's try to find the Transfer event or just grab the last topic from your specific logs
            try {
                // 假設這是標準 ERC721 Transfer(from, to, tokenId)
                // topic[0]: hash, topic[1]: from, topic[2]: to, topic[3]: tokenId
                const logs = dataFromMintReceipt.logs
                // 找到包含 4 個 topics 的 log (Transfer event)
                const transferLog = logs.find(l => l.topics.length === 4)

                if (transferLog) {
                    const hexTokenId = transferLog.topics[3]
                    const intTokenId = parseInt(hexTokenId!, 16)
                    setLastMintedTokenId(intTokenId.toString())
                    // 自動填入下方搜尋框，方便使用者直接查看
                    setTokenId(intTokenId.toString())
                }
            } catch (e) {
                console.error("Could not parse token ID from receipt", e)
            }
        }
    }, [isMintConfirmed, dataFromMintReceipt])

    // --- UI Helper ---
    function getMintButtonContent() {
        if (isMintPending)
            return (
                <>
                    <CgSpinner className="animate-spin" size={20} /> Confirm in Wallet...
                </>
            )
        if (isMintConfirming)
            return (
                <>
                    <CgSpinner className="animate-spin" size={20} /> Minting on-chain...
                </>
            )
        if (isMintConfirmed) return <>Success! Mint Another</>
        return (
            <>
                <RiSwordFill size={20} /> Mint Ninja NFT
            </>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Left Column: Minting Station */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 flex flex-col justify-center items-center shadow-xl relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px] group-hover:bg-purple-500/30 transition-all duration-500" />

                <h3 className="text-xl font-bold text-white mb-6 z-10 font-mono">Mint Station</h3>

                <div className="relative z-10 w-full max-w-xs space-y-6 text-center">
                    <div className="w-48 h-48 mx-auto bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center relative overflow-hidden">
                        {isMintConfirming ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <CgSpinner className="animate-spin text-purple-500" size={40} />
                            </div>
                        ) : (
                            <span className="text-6xl">🥷</span>
                        )}
                        <p className="absolute bottom-2 text-xs text-zinc-500">Mystery Ninja</p>
                    </div>

                    <button
                        className={`
                            w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                            ${
                                isMintPending || isMintConfirming
                                    ? "bg-zinc-700 cursor-wait opacity-80"
                                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-900/30 hover:shadow-purple-900/50"
                            }
                        `}
                        onClick={handleMintNinja}
                        disabled={isMintPending || isMintConfirming}
                    >
                        {getMintButtonContent()}
                    </button>

                    {mintNinjaError && (
                        <p className="text-sm text-red-400">Mint failed. Please try again.</p>
                    )}

                    {isMintConfirmed && lastMintedTokenId && (
                        <div className="animate-bounce text-green-400 font-mono text-sm">
                            Minted Token #{lastMintedTokenId}!
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Preview Station */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 font-mono">Ninja Viewer</h3>

                <div className="space-y-6">
                    {/* Search Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                            Token ID
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={tokenId}
                            onChange={e => setTokenId(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-600"
                        />
                    </div>

                    {/* Image Preview Box */}
                    <div className="aspect-square w-full bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden">
                        {isTokenURILoading ? (
                            <div className="flex flex-col items-center gap-3">
                                <CgSpinner className="animate-spin text-purple-500" size={32} />
                                <span className="text-zinc-600 text-sm animate-pulse">
                                    Deciphering Metadata...
                                </span>
                            </div>
                        ) : nftImageUrl ? (
                            <div className="relative w-full h-full group">
                                {/* Glow Effect behind image */}
                                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-50" />
                                <Image
                                    src={nftImageUrl}
                                    alt={`Ninja #${tokenId}`}
                                    fill
                                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                                    unoptimized // 必須開啟，因為是 Data URI
                                />
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs text-white border border-white/10">
                                    Ninja #{tokenId}
                                </div>
                            </div>
                        ) : tokenURIError ? (
                            <div className="text-center text-zinc-600">
                                <p>❌ Not Found</p>
                                <p className="text-xs mt-1">Check Token ID</p>
                            </div>
                        ) : (
                            <div className="text-zinc-700 text-sm">Enter Token ID to view</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
