"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { anvil, sepolia } from "wagmi/chains"

export default getDefaultConfig({
    appName: "Neon Marketplace",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [
        anvil, // Local Anvil (Chain ID 31337)
        sepolia, // Sepolia Testnet (Chain ID 11155111)
    ],
    ssr: true,
})
