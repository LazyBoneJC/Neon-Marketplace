"use client"

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useWatchAsset } from "wagmi"
import { addDecimalsToPrice } from "@/utils/formatPrice"
import { parseAbi } from "viem" // 引入這個來定義 ABI

// 你的 Sepolia MockUSDC 地址
const MOCK_USDC_ADDRESS = "0xb51adb70bE6018888f5df053E0B9FE4C4C57d85c"

// 1. 定義只包含 mint 的 ABI (解決按鈕沒反應的問題)
const mintAbi = parseAbi(["function mint(address to, uint256 amount) public returns (bool)"])

export default function FaucetButton() {
    const { address, isConnected } = useAccount()

    const { watchAsset } = useWatchAsset()

    const { data: hash, isPending, writeContract } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    const handleClaim = () => {
        if (!address) return
        const formattedPrice = addDecimalsToPrice("500")

        writeContract({
            abi: mintAbi, // 使用正確的 ABI
            address: MOCK_USDC_ADDRESS,
            functionName: "mint",
            // 2. 轉成 BigInt 確保型別正確
            args: [address, BigInt(formattedPrice)],
        })
    }

    // 3. 新增：加入錢包的輔助函式
    // const addTokenToWallet = async () => {
    //     if (!window.ethereum) return
    //     try {
    //         await window.ethereum.request({
    //             method: "wallet_watchAsset",
    //             params: {
    //                 type: "ERC20",
    //                 options: {
    //                     address: MOCK_USDC_ADDRESS,
    //                     symbol: "USDC", // 代幣符號
    //                     decimals: 6, // 小數位數 (MockUSDC 是 6)
    //                     image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", // (選填) 代幣圖示
    //                 },
    //             },
    //         })
    //     } catch (error) {
    //         console.error("Failed to add token:", error)
    //     }
    // }

    const addTokenToWallet = () => {
        watchAsset({
            type: "ERC20",
            options: {
                address: MOCK_USDC_ADDRESS,
                symbol: "USDC",
                decimals: 6,
                image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", // (選填) 代幣圖示
            },
        })
    }

    if (!isConnected) return null

    // 4. 成功後的 UI：顯示加入錢包按鈕
    if (isSuccess)
        return (
            <div className="flex flex-col items-start gap-2 animate-fade-in">
                <div className="text-green-400 text-sm font-bold bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20">
                    ✅ 500 USDC Received!
                </div>
                <button
                    onClick={addTokenToWallet}
                    className="text-xs text-zinc-400 hover:text-purple-400 underline underline-offset-4 flex items-center gap-1"
                >
                    <span>Add USDC to MetaMask</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                </button>
            </div>
        )

    return (
        <button
            onClick={handleClaim}
            disabled={isPending || isConfirming}
            className="group relative px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl transition-all hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
            <div className="flex items-center gap-2">
                <span className="text-xl">🚰</span>
                <div className="text-left">
                    <p className="text-xs text-zinc-400 font-mono">Need Test Funds?</p>
                    <p className="text-sm font-bold text-white group-hover:text-purple-400">
                        Claim 500 USDC
                    </p>
                </div>
            </div>
            {(isPending || isConfirming) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
            )}
        </button>
    )
}
