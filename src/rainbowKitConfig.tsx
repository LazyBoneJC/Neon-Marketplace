"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { anvil, sepolia } from "wagmi/chains"

// Only include anvil in development
const isDev = process.env.NODE_ENV === 'development'

export default getDefaultConfig({
    appName: "Neon Marketplace",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: isDev 
        ? [anvil, sepolia] // Include local Anvil in development
        : [sepolia],       // Only Sepolia in production
    ssr: true,
})
