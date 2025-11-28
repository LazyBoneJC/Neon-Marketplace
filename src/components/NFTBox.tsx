import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useReadContract } from "wagmi"
import { ninjaAbi } from "../constants" // 確保這裡有包含 tokenURI 的標準 ABI
import formatPrice from "../utils/formatPrice"

interface NFTBoxProps {
    tokenId: string
    contractAddress: string
    price: string
    seller?: string
}

// 輔助函式：縮短地址顯示
const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function NFTBox({ tokenId, contractAddress, price, seller }: NFTBoxProps) {
    const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)
    const [nftName, setNftName] = useState<string | null>(null)
    const [isLoadingImage, setIsLoadingImage] = useState(false)

    // 讀取合約
    const { data: tokenURIData } = useReadContract({
        abi: ninjaAbi, // 只要有 tokenURI function 的 ABI 都可以通用
        address: contractAddress as `0x${string}`,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
    })

    useEffect(() => {
        if (tokenURIData) {
            setIsLoadingImage(true)
            const processMetadata = async () => {
                try {
                    const tokenURI = tokenURIData as string

                    // 1. 判斷是否為 Base64 (On-chain Metadata)
                    if (tokenURI.startsWith("data:application/json;base64,")) {
                        const base64Json = tokenURI.replace("data:application/json;base64,", "")
                        const jsonString = atob(base64Json) // 解碼 Base64
                        const metadata = JSON.parse(jsonString)

                        setNftImageUrl(metadata.image)
                        setNftName(metadata.name)
                    }
                    // 2. 判斷是否為 IPFS 或 HTTP
                    else if (tokenURI.startsWith("http") || tokenURI.startsWith("ipfs")) {
                        // 簡單處理 IPFS Gateway
                        const url = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
                        const response = await fetch(url)
                        const metadata = await response.json()

                        // 同樣處理圖片的 IPFS
                        const image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")
                        setNftImageUrl(image)
                        setNftName(metadata.name)
                    }
                } catch (e) {
                    console.error("Failed to parse metadata", e)
                } finally {
                    setIsLoadingImage(false)
                }
            }
            processMetadata()
        }
    }, [tokenURIData])

    return (
        <Link href={`/buy-nft/${contractAddress}/${tokenId}`}>
            <div className="group relative w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:border-purple-500/50 cursor-pointer">
                {/* 1. 圖片區域：加入 Hover 放大效果 */}
                <div className="relative aspect-square w-full bg-zinc-800 overflow-hidden">
                    {/* 頂部光暈裝飾 */}
                    <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-purple-500/10 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {!nftImageUrl ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {isLoadingImage ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-zinc-500 animate-pulse">
                                        Deciphering...
                                    </span>
                                </div>
                            ) : (
                                <Image
                                    src="/placeholder.avif"
                                    alt="Loading"
                                    fill
                                    className="object-cover opacity-50 grayscale"
                                />
                            )}
                        </div>
                    ) : (
                        <Image
                            src={nftImageUrl}
                            alt={nftName || `NFT #${tokenId}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            unoptimized // 對於 Data URI 圖片建議開啟這個，避免 Next.js 優化報錯
                        />
                    )}

                    {/* 價格標籤 (浮在圖片右下角) */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
                        <div className="flex items-center gap-1">
                            <span className="text-purple-400 font-bold text-sm">
                                {formatPrice(price)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. 內容區域：深色背景 + 霓虹文字 */}
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-white font-bold font-mono tracking-tight text-lg truncate pr-2">
                                {nftName || `Ninja #${tokenId}`}
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1 font-mono">ID: {tokenId}</p>
                        </div>
                        {/* 鏈上識別小圖示 */}
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <svg
                                className="w-3 h-3 text-zinc-400"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                            </svg>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-zinc-400 font-mono">
                        <span>Owner</span>
                        <span className="text-zinc-300 bg-zinc-800/50 px-2 py-1 rounded hover:text-purple-400 transition-colors">
                            {seller ? truncateAddress(seller) : truncateAddress(contractAddress)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
